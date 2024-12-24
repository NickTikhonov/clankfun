"use client"

import { Download, Share } from "lucide-react";
import { useEffect, useState } from "react";

function iOS() {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform)
  // iPad on iOS 13 detection
  || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

export function PwaBanner() {
  const [notPwa, setNotPwa] = useState(false)

  useEffect(() => {
    setNotPwa(isIphoneNotInPwa() && iOS())
  }, [])

  function isIphoneNotInPwa() {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return false
    }
    return true
  }

  return (
    <>
      {notPwa && (
        <div className="md:hidden fixed bottom-12 text-xs w-full bg-[#7962d9] border-white/10 border-t text-white p-2 text-center flex flex-col gap-1 z-[100]">
          {/* <div className="w-full flex items-center justify-center gap-2">
            <Download className="w-5 h-5" />
          </div> */}
          <p className="flex flex-wrap items-center gap-2 justify-center w-full">
            Install the app: tap share <Share className="w-3 h-3" /> and &apos;add to Home Screen&apos;
          </p>
        </div>
      )}
    </>
  );
}