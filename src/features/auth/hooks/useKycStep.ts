import { useState } from 'react'
import { useNavigate } from 'react-router'
import { paths } from '@/routes/paths'
import { KYC_BENEFITS } from '../constants'

export function useKycStep() {
  const navigate = useNavigate()
  const [kycRequested, setKycRequested] = useState(false)
  return {
    benefits: KYC_BENEFITS,
    kycRequested,
    startKyc: () => setKycRequested(true),
    finish: () => navigate(paths.dashboard, { replace: true }),
  }
}
