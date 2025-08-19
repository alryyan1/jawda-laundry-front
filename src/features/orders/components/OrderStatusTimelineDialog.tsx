import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock, Package, Truck } from "lucide-react";
import type { Order } from "@/types";
import { useTranslation } from "react-i18next";

type OrderStatusTimelineDialogProps = {
	order: Order | null;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

const TimelineRow: React.FC<{
	icon: React.ReactNode;
	label: string;
	value?: string | null;
	isActive?: boolean;
}> = ({ icon, label, value, isActive }) => {
	return (
		<div className="flex items-start gap-3">
			<div className={`mt-0.5 ${isActive ? "text-green-600" : "text-muted-foreground"}`}>{icon}</div>
			<div className="flex-1">
				<div className="text-sm font-medium">{label}</div>
				<div className="text-xs text-muted-foreground">
					{value ? new Date(value).toLocaleString() : "—"}
				</div>
			</div>
		</div>
	);
};

export const OrderStatusTimelineDialog: React.FC<OrderStatusTimelineDialogProps> = ({ order, isOpen, onOpenChange }) => {
	const { t } = useTranslation(["orders", "common"]);

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="text-lg">
						{t("statusTimeline", { ns: "orders", defaultValue: "Status Timeline" })} #{order?.id}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-3">
					<TimelineRow icon={<Clock className="h-4 w-4" />} label={t("created", { ns: "orders", defaultValue: "Created" })} value={order?.created_at} isActive={!!order?.created_at} />
					<Separator />
					<TimelineRow icon={<Package className="h-4 w-4" />} label={t("received", { ns: "orders", defaultValue: "Received" })} value={order?.received_at || null} isActive={!!order?.received_at} />
					<Separator />
					<TimelineRow icon={<CheckCircle2 className="h-4 w-4" />} label={t("completed", { ns: "orders", defaultValue: "Completed" })} value={order?.completed_at || null} isActive={!!order?.completed_at} />
					<Separator />
					<TimelineRow icon={<Truck className="h-4 w-4" />} label={t("delivered", { ns: "orders", defaultValue: "Delivered" })} value={order?.delivered_date || null} isActive={!!order?.delivered_date} />
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default OrderStatusTimelineDialog;


