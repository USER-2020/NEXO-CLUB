import ResponsiveModal from '@/Components/ResponsiveModal';
import { PropsWithChildren } from 'react';

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
}: PropsWithChildren<{
    show: boolean;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    closeable?: boolean;
    onClose: CallableFunction;
}>) {
    return <ResponsiveModal show={show} onClose={() => onClose()} maxWidth={maxWidth} closeable={closeable}>{children}</ResponsiveModal>;
}
