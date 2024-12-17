
export default function Page() {
  return (
    <div className="bg-[#090F11] flex justify-center items-center h-screen">
      <div className="text-white flex flex-col gap-2 items-center">
        <div className="flex items-center gap-2 text-2xl">
          <img src="/clankfun.png" className="w-8 h-8 rounded-md"/>
          clank.fun roadmap:
        </div>
        <ul className="text-lg">
          <li>Make the best trading UX on Base 🔵</li>
        </ul>
        <a href="https://t.me/clankfun" className="mt-20 underline">join the mission</a>
      </div>
    </div>
  )
}