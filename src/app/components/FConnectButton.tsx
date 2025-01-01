import { usePrivy } from "@privy-io/react-auth";
import { FButton } from "./FButton";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { FInput } from "./FInput";
import { useAccount } from "wagmi";

export const FConnectButton = () => {
  const { authenticated, user, login, logout, exportWallet } = usePrivy();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const account = useAccount()

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
  };

  const handleCancelLogout = () => {
    setIsLogoutModalOpen(false);
  };

  return (
    <>
      <FButton onClick={authenticated ? handleLogout : login} primary={!authenticated} selected>
        {authenticated ? user?.wallet?.address?.slice(0, 5) : "Connect"}
      </FButton>
      <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <span>Wallet Address:</span>
              <FInput value={user?.wallet?.address ?? ""} onChange={() => void 0} placeholder=""/>
            </div>
          </div>
          <DialogFooter className="gap-0.5">
            <Button size="sm" variant="outline" onClick={handleCancelLogout}>
              Cancel
            </Button>
            {user?.email && <Button size="sm" onClick={exportWallet}>Export Wallet</Button>}
            <Button size="sm" onClick={handleConfirmLogout}>Logout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const FConnectButtonLarge = () => {
  const { authenticated, user, login, logout } = usePrivy();

  return (
    <Button onClick={authenticated ? logout : login} className="w-full">
      {authenticated ? user?.wallet?.address?.slice(0, 5) : "Connect Wallet"}
    </Button>
  );
};