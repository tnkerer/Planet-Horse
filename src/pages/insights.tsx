'use client';

import React from 'react'
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useRouter } from 'next/router';
 
const Insights: React.FC = () => {
  const router = useRouter();
 
  return <SpeedInsights route={router.pathname} />;
}

export default Insights