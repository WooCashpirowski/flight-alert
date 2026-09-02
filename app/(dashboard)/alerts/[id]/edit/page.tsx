import { notFound } from 'next/navigation';
import { AlertForm } from '@/src/modules/alerts/components/alert-form';
import { getDashboardData } from '@/src/modules/alerts/queries';

export default async function EditAlertPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const { alerts } = await getDashboardData();
    const alert = alerts.find((item) => item.id === id);
    if (!alert) notFound();

    return (
        <AlertForm
            alert={{
                id: alert.id,
                origin: alert.origin,
                destination: alert.destination,
                isRoundTrip: Boolean(alert.returnDate),
                departureDate: alert.departureDate,
                returnDate: alert.returnDate ?? '',
                flexDays: alert.flexDays,
                maxPrice: alert.maxPrice,
                active: alert.active,
            }}
        />
    );
}
