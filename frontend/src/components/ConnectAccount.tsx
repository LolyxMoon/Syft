import React from "react";
import { WalletButton } from "./WalletButton";
import NetworkPill from "./NetworkPill";

interface ConnectAccountProps {
  variant?: 'default' | 'mobile';
}

const ConnectAccount: React.FC<ConnectAccountProps> = ({ variant = 'default' }) => {
  if (variant === 'mobile') {
    return (
      <div className="flex flex-col gap-3 w-full">
        <WalletButton />
        <NetworkPill />
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center gap-3">
      <WalletButton />
      <NetworkPill />
    </div>
  );
};

export default ConnectAccount;
