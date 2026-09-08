/**
 * Admin & APM Monitoring Service
 * Handles dynamic RBAC queries and Edge Functions / pg_cron telemetry
 */
import { supabase } from './supabaseClient';

/**
 * Checks whether the currently authenticated user has admin privileges
 * @returns {Promise<{ is_admin: boolean, role: 'SUPER_ADMIN' | 'ADMIN' | null, email: string | null }>}
 */
export async function getAdminStatus() {
  try {
    if (typeof supabase?.rpc !== 'function') {
      return { is_admin: false, role: null, email: null };
    }
    const { data, error } = await supabase.rpc('get_admin_status');
    if (error) {
      console.warn('[adminService] get_admin_status RPC error:', error.message);
      return { is_admin: false, role: null, email: null };
    }
    return data || { is_admin: false, role: null, email: null };
  } catch (err) {
    console.warn('[adminService] Error fetching admin status:', err);
    return { is_admin: false, role: null, email: null };
  }
}

/**
 * Fetches all registered administrators
 * @returns {Promise<Array<{ id: number, user_id: string, email: string, role: string, created_at: string }>>}
 */
export async function listAppAdmins() {
  const { data, error } = await supabase.rpc('list_app_admins');
  if (error) throw error;
  return data || [];
}

/**
 * Grants ADMIN role to a registered user by email
 * @param {string} email
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function grantAdminRole(email) {
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail) throw new Error('Email is required');
  const { data, error } = await supabase.rpc('grant_admin_role', { p_email: cleanEmail });
  if (error) throw error;
  return data;
}

/**
 * Revokes ADMIN role from an administrator
 * @param {string} email
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function revokeAdminRole(email) {
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail) throw new Error('Email is required');
  const { data, error } = await supabase.rpc('revoke_admin_role', { p_email: cleanEmail });
  if (error) throw error;
  return data;
}

/**
 * Fetches executive 24-hour APM metrics
 * @returns {Promise<{
 *   total_runs_24h: number,
 *   success_runs_24h: number,
 *   failed_runs_24h: number,
 *   error_rate_pct: number,
 *   avg_duration_ms: number,
 *   max_duration_ms: number,
 *   active_crons_count: number,
 *   cron_failures_24h: number,
 *   function_breakdown: Array<{
 *     function_name: string,
 *     total_runs: number,
 *     success_runs: number,
 *     failed_runs: number,
 *     avg_duration_ms: number,
 *     max_duration_ms: number,
 *     last_run_at: string
 *   }>,
 *   generated_at: string
 * }>}
 */
export async function getApmOverview() {
  const { data, error } = await supabase.rpc('get_admin_apm_overview');
  if (error) throw error;
  return data;
}

/**
 * Fetches paginated & filtered Edge Function execution logs
 * @param {Object} params
 * @param {string} [params.functionName]
 * @param {string} [params.status] 'SUCCESS' | 'FAILED' | null
 * @param {string} [params.callerType] 'CRON' | 'USER' | 'SYSTEM' | null
 * @param {number} [params.limit]
 * @param {number} [params.offset]
 * @returns {Promise<{ total: number, logs: Array<any> }>}
 */
export async function getExecutionLogs({ functionName = null, status = null, callerType = null, limit = 50, offset = 0, search = null } = {}) {
  let { data, error } = await supabase.rpc('get_admin_execution_logs', {
    p_function_name: functionName || null,
    p_status: status || null,
    p_caller_type: callerType || null,
    p_limit: limit,
    p_offset: offset,
    p_search: search ? search.trim() : null,
  });

  // Backward compatibility fallback for legacy schema cache without p_search
  if (error && error.code === 'PGRST202') {
    const fallback = await supabase.rpc('get_admin_execution_logs', {
      p_function_name: functionName || null,
      p_status: status || null,
      p_caller_type: callerType || null,
      p_limit: limit,
      p_offset: offset,
    });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;
  return data || { total: 0, logs: [] };
}

/**
 * Fetches pg_cron active schedules and recent run history (supports limit/offset pagination)
 * @param {number|{ limit?: number, offset?: number, failureOnly?: boolean, search?: string }} [optionsOrLimit=50]
 * @returns {Promise<{
 *   jobs: Array<{ jobid: number, jobname: string, schedule: string, active: boolean, command: string }>,
 *   runs: Array<{ runid: number, jobid: number, jobname: string, status: string, return_message: string, start_time: string, end_time: string, duration_ms: number }>,
 *   total_runs: number
 * }>}
 */
export async function getCronMonitoring(optionsOrLimit = 50) {
  const params = {
    p_limit: 50,
    p_offset: 0,
    p_failure_only: false,
    p_search: null,
  };

  if (typeof optionsOrLimit === 'number') {
    params.p_limit = optionsOrLimit;
  } else if (typeof optionsOrLimit === 'object' && optionsOrLimit !== null) {
    if (optionsOrLimit.limit !== undefined) params.p_limit = optionsOrLimit.limit;
    if (optionsOrLimit.offset !== undefined) params.p_offset = optionsOrLimit.offset;
    if (optionsOrLimit.failureOnly !== undefined) params.p_failure_only = Boolean(optionsOrLimit.failureOnly);
    if (optionsOrLimit.search) params.p_search = optionsOrLimit.search.trim();
  }

  let { data, error } = await supabase.rpc('get_admin_cron_monitoring', params);

  // Backward compatibility fallback for legacy schema cache with only p_limit
  if (error && error.code === 'PGRST202') {
    const fallback = await supabase.rpc('get_admin_cron_monitoring', {
      p_limit: params.p_limit,
    });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;
  return data || { jobs: [], runs: [], total_runs: 0 };
}

/**
 * Manually triggers an Edge Function for instant diagnostics
 * @param {string} functionName
 * @returns {Promise<any>}
 */
export async function triggerEdgeFunction(functionName) {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: { trigger_source: 'ADMIN_APM_MANUAL_TEST' }
  });
  if (error) throw error;
  return data;
}
