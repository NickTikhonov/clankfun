"use client"

import { useToast } from "~/hooks/use-toast";
import { FButton } from "../components/FButton";
import { FInput } from "../components/FInput";

import { set } from "lodash";
import { adminSetNSFW } from "./server";

import { useEffect, useState } from "react";

export function AdminView() {
  const [adminSecret, setAdminSecret] = useState("");
  const [processing, setProcessing] = useState(false);
  const [nsfwCA, setNsfwCA] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const storedSecret = typeof window !== "undefined" ? window.localStorage.getItem("adminSecret") : "";
    setAdminSecret(storedSecret ?? "");
  }, []);

  const handleSetAdminSecret = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("adminSecret", adminSecret);
    }
    setAdminSecret(adminSecret);
    toast({
      title: "Admin secret set!",
      description: "You can now perform admin actions.",
    });
  };

  const handleMarkNsfw = async (nsfw: boolean) => {
    setProcessing(true);
    try {
      await adminSetNSFW(adminSecret, nsfwCA, true);
      toast({
        title: "Token updated",
        description: `Token ${nsfwCA} was successfully updated`,
      });
    } catch(e) {
      toast({
        title: "Error updating token",
        description: "Make sure you pasted the CA correctly. You can grab it from the URL of the token page.",
      });
    }
    setNsfwCA("");
    setProcessing(false)
  };

  return (
    <div className="w-full flex justify-center p-3">
      <div className="w-full max-w-2xl flex flex-col gap-2 mt-2 md:mt-12">
        <h1 className="text-xl font-bold">Clank.fun admin</h1>
        <p className="text-sm text-white/50">
          First step: Grab the admin key from Nick and set it above.
        </p>
        <p className="text-sm text-white/50">
          It will be saved in your browser session.
        </p>
        <div className="flex items-center gap-2">
          <FInput
            placeholder={adminSecret}
            value={adminSecret}
            onChange={(v) => setAdminSecret(v)}
          />
          <FButton onClick={handleSetAdminSecret} primary>
            Save
          </FButton>
        </div>
        <h1 className="text-lg">Mark token as NSFW. Criteria:</h1>
        <ul>
          <li>
            <p className="text-sm text-white/50">
              You would not want to be caught seen looking at this token in public. Paste the CA below to mark it as NSFW and remove it from default feeds.
            </p>
          </li>
        </ul>
        <div className="flex items-center gap-2">
          {adminSecret ? <FInput
            placeholder="Paste token CA"
            value={nsfwCA}
            onChange={(v) => setNsfwCA(v)}
          /> : <p>
            Set the admin secret above to enable this feature
          </p>}
        </div>
        <div className="flex items-center gap-2">
          Set token as
          {!processing && <FButton onClick={() => handleMarkNsfw(true)} primary>
            NSFW
          </FButton>}
          {!processing && <FButton onClick={() => handleMarkNsfw(false)} primary>
            SFW
          </FButton>}
        </div>
        <p className="text-sm text-green-500">
          Note: it may take 10-15 minutes for the change to propagate to feeds.
        </p>
      </div>
    </div>
  );
}