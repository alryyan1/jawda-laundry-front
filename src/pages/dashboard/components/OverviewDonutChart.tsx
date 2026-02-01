// src/pages/dashboard/components/OverviewDonutChart.tsx
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { DashboardSummary } from "@/types";

interface OverviewDonutChartProps {
  summary: DashboardSummary | undefined;
  // isLoading removed as it was unused
}

export const OverviewDonutChart: React.FC<OverviewDonutChartProps> = ({
  summary,
}) => {
  const { t } = useTranslation(["dashboard", "orders"]);

  const data = useMemo(() => {
    if (!summary) return [];
    return [
      {
        name: t("status_pending", { ns: "orders" }),
        value: summary.pendingOrders || 0,
        color: "#94a3b8",
      },
      {
        name: t("status_processing", { ns: "orders" }),
        value: summary.processingOrders || 0,
        color: "#f59e0b",
      },
      {
        name: t("status_ready_for_pickup", { ns: "orders" }),
        value: summary.readyForPickupOrders || 0,
        color: "#22c55e",
      },
      {
        name: t("status_delivered", { ns: "orders" }),
        value: summary.deliveredOrders || 0,
        color: "#3b82f6",
      },
    ].filter((item) => item.value > 0);
  }, [summary, t]);

  // Custom Legend to match image style (bottom with dots)
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div
            key={`item-${index}`}
            className="flex items-center text-xs text-slate-500"
          >
            <div
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="shadow-sm border-slate-200 h-full min-h-[400px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-normal text-slate-600">
          Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80} // Donut style
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    strokeWidth={0}
                  />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Legend
                content={renderLegend}
                verticalAlign="bottom"
                height={60}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center Text (Total Orders? Or just decorative?) - Image shows empty hole */}
        </div>
      </CardContent>
    </Card>
  );
};
