import React from 'react'
import ReferralPage from "@/components/referral/page";
import Navbar from "@/utils/components/navbar";
import Pattern from "@/utils/components/pattern";

const Referral: React.FC = () => {
  return (
    <div>
      <div style={{ paddingBottom: 90 }}>
        <Navbar />
      </div>

      <Pattern type="light">
        <ReferralPage />
      </Pattern>
    </div>
  );
}

export default Referral
