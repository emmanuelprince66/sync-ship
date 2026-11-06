import type { IconName } from '@/components/ui/Icon'

export type AuthStage = 'access' | 'otp' | 'business' | 'kyc'
export type AccessMode = 'login' | 'signup'

/** Onboarding stages shown in the "Account setup · Step x of 3" bar. */
export const SETUP_STAGES: AuthStage[] = ['otp', 'business', 'kyc']

/** URL segment after /signup/ → stage. */
export const STEP_TO_STAGE: Record<string, AuthStage> = { verify: 'otp', business: 'business', kyc: 'kyc' }

export const OTP_LENGTH = 6
export const RESEND_SECONDS = 28
export const SLIDE_INTERVAL_MS = 4500

export const AUTH_SLIDES: { label: string; title: string; text: string; icon: IconName }[] = [
  { label: 'Your storefront', title: 'Sell products from one simple link.', text: 'Customers browse, pay, and arrange delivery without sending a message.', icon: 'building' },
  { label: 'Trusted delivery partners', title: 'Compare rates. Pick what works.', text: 'See trusted partners and live prices for every customer destination.', icon: 'truck' },
  { label: 'Live order tracking', title: 'Know exactly where every order is.', text: 'Follow pickup and delivery progress from a single clean dashboard.', icon: 'route' },
]

export const KYC_BENEFITS = ['Higher withdrawal limits', 'Verified storefront badge', 'Priority payment settlements']
