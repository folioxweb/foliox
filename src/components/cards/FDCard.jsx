import Badge from "../ui/Badge";
import { formatCurrency } from "../../utils/formatters";
import { usePrivacy } from "../../context/PrivacyContext";

export default function FDCard({
  holding,
  onPress
}) {

  const {
    name,
    principal,
    interestRate,
    currentValue,
    maturityValue,
    interestEarned
  } = holding;

  const { isPrivacyMode } = usePrivacy();

  const glassStyle = {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(255,255,255,0.10)"
  };

  const Tag = onPress ? "button" : "article";

  const tagProps =
    Tag === "button"
      ? {
          type: "button",
          onClick: onPress,
          style: {
            ...glassStyle,
            cursor: "pointer"
          }
        }
      : {
          style: glassStyle
        };

  return (
    <Tag
      {...tagProps}
      className="w-full rounded-[24px] px-4 py-4 shadow-lg text-left"
    >

      <div className="flex items-start justify-between mb-3">

        <div>

          <div className="text-sm font-bold text-white">
            {isPrivacyMode
              ? "Confidential FD"
              : name}
          </div>

          <Badge
            label="Fixed Deposit"
            color="#14B8A6"
          />

        </div>

      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">

        <Metric
          label="Principal"
          value={
            isPrivacyMode
              ? "₹***"
              : formatCurrency(principal)
          }
        />

        <Metric
          label="Rate"
          value={`${interestRate}%`}
        />

        <Metric
          label="Current"
          value={
            isPrivacyMode
              ? "₹***"
              : formatCurrency(currentValue)
          }
        />

        <Metric
          label="Maturity"
          value={
            isPrivacyMode
              ? "₹***"
              : formatCurrency(maturityValue)
          }
        />

      </div>

      <div
        className="my-3"
        style={{
          height: 1,
          background:
            "rgba(255,255,255,0.06)"
        }}
      />

      <div className="flex items-center justify-between">

        <div>

          <div className="text-xs uppercase text-slate-500">
            Interest Earned
          </div>

          <div className="text-sm font-bold text-green-500">

            {isPrivacyMode
              ? "₹***"
              : formatCurrency(interestEarned)}

          </div>

        </div>

        <div className="rounded-full bg-green-500/10 px-3 py-1 text-green-500 font-bold">

          {interestRate}%

        </div>

      </div>

    </Tag>
  );

}

function Metric({

  label,

  value

}) {

  return (

    <div>

      <div className="text-xs uppercase text-slate-500">

        {label}

      </div>

      <div className="text-sm font-semibold text-white">

        {value}

      </div>

    </div>

  );

}