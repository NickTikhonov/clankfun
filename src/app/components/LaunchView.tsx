import { useEffect, useState } from "react";
import { type ClankerWithData } from "../server";
import { FInput } from "./FInput";
import { FImageUpload } from "./FImageUpload";
import { useAccount, useSignMessage } from "wagmi";
import { FConnectButtonLarge } from "./FConnectButton";
import { Button } from "~/components/ui/button";
import { serverCheckBalance, serverLaunchToken } from "../server-launch";
import { useToast } from "~/hooks/use-toast";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics/react";
import { CircleCheckBigIcon, DollarSign, Megaphone, Wallet, XIcon } from "lucide-react";
import { CLANKFUN_BALANCE_GATE, CLANKFUN_CA } from "../constants";
import { ClankerCard } from "./ClankerCard";

export function LaunchView() {
  const { toast } = useToast()

  const [nonce, setNonce] = useState<string|null>(null);
  const [launching, setLaunching] = useState<boolean>(false);
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const { address } = useAccount()
  const { isPending: signPending, signMessageAsync } = useSignMessage()

  const [checkingBalance, setCheckingBalance] = useState<boolean>(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [required, setRequired] = useState<number | null>(null);

  useEffect(() => {
    async function checkBalance() {
      if (!address) return;
      setCheckingBalance(true)
      try {
        const { balance, required } = await serverCheckBalance(address)
        setBalance(balance)
        setRequired(required)
      } catch(e: any) {
        console.error("Failed to check balance", e.message)
        toast({
          title: "Error checking balance",
          description: e.message
        })
      } finally {
        setCheckingBalance(false)
      }
    }

    void checkBalance()
  }, [address])

  function updateNonce() {
    const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setNonce(randomString);
  }

  useEffect(() => {
    updateNonce()
  }, []);

  const canLaunch = nonce && name.length > 0 && ticker.length > 0 && address
  let buttonName = "Launch"
  if (signPending) {
    buttonName = "Sign in wallet"
  } else if (launching) {
    buttonName = "Launching..."
  }

  const router = useRouter()

  async function launchToken() {
    setLaunching(true)
    try {
      const canLaunch = nonce && name.length > 0 && ticker.length > 0 && address
      if (!canLaunch) return;
      const signature = await signMessageAsync({ message: nonce })
      console.log(signature)

      console.log("Name:", name)
      console.log("Ticker:", ticker)
      console.log("Image:", image)
      console.log("Address:", address)
      console.log("Nonce:", nonce)
      console.log("Signature:", signature)

      const ca = await serverLaunchToken({
        name,
        ticker,
        image,
        address,
        nonce: nonce!,
        signature
      });

      setName("")
      setTicker("")
      setImage(null)
      track("Launch", { 
        address,
        ca 
      })
      toast({
        title: "Token launched! Redirecting...",
        description: "Your token has been successfully launched. Redirecting to the token page."
      })
      router.push(`/t/${ca}`);
    } catch(e: any) {
      console.error("Failed to launch token", e.message)
      toast({
        title: "Error launching token",
        description: e.message
      })
      updateNonce()
    } finally {
      setLaunching(false)
    }
  }

  const previewClanker = {
    name: name.length > 0 ? name : "[Your Token]",
    symbol: ticker.length > 0 ? ticker : "[YOURTICKER]",
    img_url: image,
    pool_address: "",
    cast_hash: "",
    type: "clank",
    id: 0,
    created_at: new Date().toString(),
    tx_hash: "",
    requestor_fid: 0,
    contract_address: "",
    marketCap: 40000,
    decimals: 6,
    priceUsd: 0,
    cast: null
  } as ClankerWithData

  const hasBalance = balance && required && balance >= required
  const noBalance = balance && required && balance < required

  return (
    <div className="grid place-items-center">
      <div className="w-full max-w-[600px] flex flex-col items-center justify-center gap-6">
        <div className="w-full">
          <span className="text-white text-[28px] font-medium   leading-7">
            Launch a coin with
            <br />
          </span>
          <span className="text-[#b4a2ff] text-[28px] font-medium   leading-7">
            Clanker
          </span>
          <span className="text-white text-[28px] font-medium   leading-7">
            {" "}
            via clank.fun
          </span>
        </div>
        <div className="flex flex-col items-start justify-start gap-2 w-full">
          <div className="w-full   text-[15px] font-medium leading-[15px] text-white mb-2">
            You need to hold at least {CLANKFUN_BALANCE_GATE.toLocaleString()} $CLANKFUN to launch tokens
          </div>
          {hasBalance ? 
          <div className="w-full   text-[15px] font-medium leading-[15px] text-white flex items-center gap-2">
            <CircleCheckBigIcon className="w-[20px] h-[20px] text-[#00ff00]" />
            You hold enough $CLANKFUN
          </div> : null}
          <div className="w-full   text-[15px] font-medium leading-[15px] text-white flex items-center gap-2">
            <Megaphone className="w-[20px] h-[20px] text-[#00ff00]" />
            Every trade bumps your coin to the front page
          </div>
          <div className="w-full   text-[15px] font-medium leading-[15px] text-white flex items-center gap-2">
            <DollarSign className="w-[20px] h-[20px] text-[#00ff00]" />
            Earn 0.4% of the trading volume in LP fees
          </div>
          <div className="w-full   text-[15px] font-medium leading-[15px] text-white flex items-center gap-2">
            <Wallet className="w-[20px] h-[20px] text-[#00ff00]" />
            Claim your fees anytime on clanker.world
          </div>
          {noBalance ?
          <div className="w-full">
            <div className="w-full   text-[15px] font-medium leading-[15px] text-white flex items-center gap-2">
              <XIcon className="w-[20px] h-[20px] text-red-500" />
              You do not hold enough $CLANKFUN
              <a href={`/t/${CLANKFUN_CA}`} className="text-[#b4a2ff] underline">Get $CLANKFUN</a>
            </div>
          </div>
          : null}
        </div>
        {hasBalance ? <div className="w-full">
          <ClankerCard c={previewClanker} noLink/>
        </div> : null}
        {hasBalance ? <div className="w-full flex flex-col items-start justify-start gap-4">
          <div className="h-[53px] flex flex-col items-start justify-start gap-2 w-full">
            <div className="w-full   text-[15px] font-medium leading-[15px] text-white">
              Name
            </div>
            <FInput value={name} onChange={setName} placeholder="Enter token name" />
          </div>
          <div className="h-[53px] flex flex-col items-start justify-start gap-2 w-full">
            <div className="w-full   text-[15px] font-medium leading-[15px] text-white">
              Ticker
            </div>
            <FInput value={ticker} onChange={setTicker} placeholder="Enter ticker" />
          </div>
          <div className="h-[223px] flex flex-col items-start justify-start gap-2 w-full">
            <div className="w-full   text-[15px] font-medium leading-[15px] text-white">
              Token image
            </div>
            <FImageUpload onImage={setImage} />
          </div>
        </div>: null}
        {address ? (<Button onClick={launchToken} className="w-full h-[46px] flex items-center justify-center gap-1 rounded-[10px] bg-[#7962d9] hover:bg-[#7962d9] px-[9px]" disabled={!canLaunch || launching}>
          <div className="  text-[15px] font-medium leading-[15px] text-white">
            {buttonName}
          </div>
        </Button>) : (
          <FConnectButtonLarge />
        )}
      </div>
    </div>
  );
}
