import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useAppStore } from './store'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  const state = useAppStore.getState();
  const user = state.users.find(u => u.id === state.session.currentUserId);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const currentSpa = state.spas.find(s => s.id === user?.spaId);
  const currencyCode = isSuperAdmin ? 'INR' : (currentSpa?.settings?.currency || 'INR');

  const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
}

export function getPaymentQrUrl(qrCodeUrl: string | undefined, upiId: string, price: number, currency: string) {
  if (!qrCodeUrl) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      `upi://pay?pa=${upiId}&pn=SpaPOS&am=${price}&cu=${currency}`
    )}`;
  }

  let resolvedUrl = qrCodeUrl.trim();

  // Convert Google Drive preview link to direct image link
  if (resolvedUrl.includes('drive.google.com') || resolvedUrl.includes('docs.google.com') || resolvedUrl.includes('google.com/file/d/')) {
    const match = resolvedUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || resolvedUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      resolvedUrl = `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
  }
  // Convert Dropbox link to raw direct image link
  else if (resolvedUrl.includes('dropbox.com')) {
    resolvedUrl = resolvedUrl.replace(/[?&]dl=[01]/g, '');
    resolvedUrl = resolvedUrl + (resolvedUrl.includes('?') ? '&raw=1' : '?raw=1');
  }

  // Check if it is a direct image format web URL
  const isDirectImage = resolvedUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) !== null || 
                        resolvedUrl.includes('lh3.googleusercontent.com/d/') || 
                        resolvedUrl.includes('raw=1');

  if (isDirectImage) {
    return resolvedUrl;
  }

  // If it's a deep-link, standard payment link, or redirect, generate the QR code image
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(resolvedUrl)}`;
}
