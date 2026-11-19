import { useReducedMotion } from 'framer-motion';
import { CircleDollarSign } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export type FinancialActivity = {
    year: number;
    months: { month: string; label: string; paid: number; outstanding: number }[];
};

export const formatCop = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
}).format;

const compactCop = new Intl.NumberFormat('es-CO', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
}).format;

export default function ClubFinancialChart({ activity }: { activity: FinancialActivity }) {
    const reduceMotion = useReducedMotion();
    const hasActivity = activity.months.some(({ paid, outstanding }) => paid > 0 || outstanding > 0);

    return (
        <section className="nexo-card min-w-0 p-4 sm:p-6" data-tour="dashboard-finances" aria-labelledby="club-financial-activity">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 id="club-financial-activity" className="text-lg font-bold">Actividad financiera</h2>
                    <p className="mt-1 text-sm text-slate-400">Recaudos por fecha de pago y cartera abierta por vencimiento</p>
                </div>
                <span className="shrink-0 rounded-lg border border-slate-700 px-3 py-1 text-sm font-semibold text-slate-300">{activity.year}</span>
            </div>
            {hasActivity ? <>
                <div className="mt-5 h-64 w-full min-w-0 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activity.months} maxBarSize={24}>
                            <CartesianGrid stroke="#26344b" vertical={false} />
                            <XAxis dataKey="month" tick={{ fill: '#cbd5e1', fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={9} />
                            <YAxis width={54} allowDecimals={false} tickFormatter={compactCop} tick={{ fill: '#cbd5e1', fontSize: 12 }} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: '#26344b', opacity: 0.45 }}
                                formatter={(value) => formatCop(Number(value))}
                                labelFormatter={(month) => activity.months.find((point) => point.month === month)?.label ?? month}
                                contentStyle={{ background: '#0B1220', border: '1px solid #334155', borderRadius: 12 }}
                                labelStyle={{ color: '#f8fafc', textTransform: 'capitalize' }}
                            />
                            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                            <Bar dataKey="paid" name="Recaudado" fill="#B8F34B" radius={[4, 4, 0, 0]} isAnimationActive={!reduceMotion} animationDuration={650} />
                            <Bar dataKey="outstanding" name="Cartera abierta" fill="#fbbf24" radius={[4, 4, 0, 0]} isAnimationActive={!reduceMotion} animationDuration={650} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <details className="mt-3 border-t border-slate-800">
                    <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-nexo-lime focus-visible:outline focus-visible:outline-nexo-lime">
                        Ver datos por mes
                    </summary>
                    <table className="w-full text-sm">
                        <thead className="text-slate-300">
                            <tr>
                                <th scope="col" className="py-2 text-left">Mes</th>
                                <th scope="col" className="py-2 text-right">Recaudado</th>
                                <th scope="col" className="py-2 text-right">Cartera abierta</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activity.months.map(({ month, label, paid, outstanding }) => (
                                <tr key={month} className="border-t border-slate-800">
                                    <th scope="row" className="py-2 text-left font-medium capitalize text-slate-300">{label}</th>
                                    <td className="py-2 text-right tabular-nums">{formatCop(paid)}</td>
                                    <td className="py-2 text-right tabular-nums">{formatCop(outstanding)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </details>
            </> : <div className="flex min-h-52 flex-col items-center justify-center gap-3 py-6 text-center">
                <CircleDollarSign size={28} className="text-slate-500" />
                <p className="font-semibold text-slate-300">Aún no hay recaudos ni cartera para este año.</p>
            </div>}
        </section>
    );
}
