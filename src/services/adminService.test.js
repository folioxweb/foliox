import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as adminService from './adminService';
import { supabase } from './supabaseClient';

vi.mock('./supabaseClient', () => ({
  supabase: {
    rpc: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAdminStatus', () => {
    it('returns admin status when RPC succeeds', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: { is_admin: true, role: 'SUPER_ADMIN', email: 'parthdeshmukh291@gmail.com' },
        error: null,
      });

      const res = await adminService.getAdminStatus();
      expect(supabase.rpc).toHaveBeenCalledWith('get_admin_status');
      expect(res.is_admin).toBe(true);
      expect(res.role).toBe('SUPER_ADMIN');
    });

    it('returns default object when RPC returns error', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Network error' },
      });

      const res = await adminService.getAdminStatus();
      expect(res.is_admin).toBe(false);
      expect(res.role).toBeNull();
    });

    it('deduplicates concurrent in-flight calls to getAdminStatus', async () => {
      let resolveRpc;
      const delayedPromise = new Promise((resolve) => {
        resolveRpc = resolve;
      });
      supabase.rpc.mockReturnValueOnce(delayedPromise);

      // Fire two concurrent calls
      const call1 = adminService.getAdminStatus();
      const call2 = adminService.getAdminStatus();

      resolveRpc({
        data: { is_admin: true, role: 'ADMIN', email: 'admin@foliox.com' },
        error: null,
      });

      const [res1, res2] = await Promise.all([call1, call2]);
      expect(supabase.rpc).toHaveBeenCalledTimes(1);
      expect(res1).toEqual(res2);
      expect(res1.is_admin).toBe(true);
    });
  });

  describe('listAppAdmins', () => {
    it('calls list_app_admins RPC', async () => {
      const mockAdmins = [{ id: 1, email: 'admin@test.com', role: 'ADMIN' }];
      supabase.rpc.mockResolvedValueOnce({ data: mockAdmins, error: null });

      const res = await adminService.listAppAdmins();
      expect(supabase.rpc).toHaveBeenCalledWith('list_app_admins');
      expect(res).toEqual(mockAdmins);
    });
  });

  describe('grantAdminRole', () => {
    it('grants admin role with lowercase trimmed email', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: { success: true, message: 'Granted role' },
        error: null,
      });

      const res = await adminService.grantAdminRole('  NewAdmin@Test.COM ');
      expect(supabase.rpc).toHaveBeenCalledWith('grant_admin_role', {
        p_email: 'newadmin@test.com',
      });
      expect(res.success).toBe(true);
    });

    it('throws error if email is empty', async () => {
      await expect(adminService.grantAdminRole('')).rejects.toThrow('Email is required');
    });
  });

  describe('revokeAdminRole', () => {
    it('revokes admin role with lowercase trimmed email', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: { success: true, message: 'Revoked role' },
        error: null,
      });

      const res = await adminService.revokeAdminRole('  Admin@Test.COM ');
      expect(supabase.rpc).toHaveBeenCalledWith('revoke_admin_role', {
        p_email: 'admin@test.com',
      });
      expect(res.success).toBe(true);
    });
  });

  describe('getApmOverview', () => {
    it('fetches apm overview metrics', async () => {
      const mockData = { total_runs_24h: 120, error_rate_pct: 0 };
      supabase.rpc.mockResolvedValueOnce({ data: mockData, error: null });

      const res = await adminService.getApmOverview();
      expect(supabase.rpc).toHaveBeenCalledWith('get_admin_apm_overview');
      expect(res).toEqual(mockData);
    });
  });

  describe('getExecutionLogs', () => {
    it('passes filter parameters correctly', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: { total: 5, logs: [] },
        error: null,
      });

      await adminService.getExecutionLogs({
        functionName: 'sync-prices',
        status: 'FAILED',
        callerType: 'CRON',
        limit: 20,
        offset: 0,
      });

      expect(supabase.rpc).toHaveBeenCalledWith('get_admin_execution_logs', {
        p_function_name: 'sync-prices',
        p_status: 'FAILED',
        p_caller_type: 'CRON',
        p_limit: 20,
        p_offset: 0,
        p_search: null,
      });
    });

    it('falls back to legacy signature if PGRST202 schema cache error occurs', async () => {
      supabase.rpc
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST202', message: 'Function not found in schema cache' },
        })
        .mockResolvedValueOnce({
          data: { total: 2, logs: [{ id: 1 }] },
          error: null,
        });

      const res = await adminService.getExecutionLogs({
        functionName: 'sync-prices',
        limit: 10,
        offset: 0,
        search: 'test',
      });

      expect(supabase.rpc).toHaveBeenNthCalledWith(1, 'get_admin_execution_logs', {
        p_function_name: 'sync-prices',
        p_status: null,
        p_caller_type: null,
        p_limit: 10,
        p_offset: 0,
        p_search: 'test',
      });
      expect(supabase.rpc).toHaveBeenNthCalledWith(2, 'get_admin_execution_logs', {
        p_function_name: 'sync-prices',
        p_status: null,
        p_caller_type: null,
        p_limit: 10,
        p_offset: 0,
      });
      expect(res.total).toBe(2);
    });
  });

  describe('getCronMonitoring', () => {
    it('fetches cron monitoring data with number limit', async () => {
      const mockData = { jobs: [], runs: [], total_runs: 0 };
      supabase.rpc.mockResolvedValueOnce({ data: mockData, error: null });

      const res = await adminService.getCronMonitoring(30);
      expect(supabase.rpc).toHaveBeenCalledWith('get_admin_cron_monitoring', {
        p_limit: 30,
        p_offset: 0,
        p_failure_only: false,
        p_search: null,
      });
      expect(res).toEqual(mockData);
    });

    it('fetches cron monitoring data with options object and search query', async () => {
      const mockData = { jobs: [], runs: [], total_runs: 0 };
      supabase.rpc.mockResolvedValueOnce({ data: mockData, error: null });

      const res = await adminService.getCronMonitoring({
        limit: 25,
        offset: 50,
        failureOnly: true,
        search: 'sync-prices',
      });
      expect(supabase.rpc).toHaveBeenCalledWith('get_admin_cron_monitoring', {
        p_limit: 25,
        p_offset: 50,
        p_failure_only: true,
        p_search: 'sync-prices',
      });
      expect(res).toEqual(mockData);
    });

    it('falls back to legacy signature if PGRST202 schema cache error occurs', async () => {
      const mockLegacyData = { jobs: [{ jobid: 1 }], runs: [{ runid: 10 }] };
      supabase.rpc
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST202', message: 'Function not found in schema cache' },
        })
        .mockResolvedValueOnce({
          data: mockLegacyData,
          error: null,
        });

      const res = await adminService.getCronMonitoring({
        limit: 50,
        offset: 0,
        failureOnly: false,
        search: 'job',
      });

      expect(supabase.rpc).toHaveBeenNthCalledWith(1, 'get_admin_cron_monitoring', {
        p_limit: 50,
        p_offset: 0,
        p_failure_only: false,
        p_search: 'job',
      });
      expect(supabase.rpc).toHaveBeenNthCalledWith(2, 'get_admin_cron_monitoring', {
        p_limit: 50,
      });
      expect(res).toEqual(mockLegacyData);
    });
  });

  describe('triggerEdgeFunction', () => {
    it('invokes Edge Function with manual test trigger body', async () => {
      supabase.functions.invoke.mockResolvedValueOnce({ data: { success: true }, error: null });

      const res = await adminService.triggerEdgeFunction('sync-news');
      expect(supabase.functions.invoke).toHaveBeenCalledWith('sync-news', {
        body: { trigger_source: 'ADMIN_APM_MANUAL_TEST' },
      });
      expect(res).toEqual({ success: true });
    });
  });
});
