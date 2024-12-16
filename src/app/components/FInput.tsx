"use client"

type Props = {
  value: string;
  onChange: (value: string) => void;
}

export function FSearchInput({ value, onChange }: Props) {
  return(
    <div className="w-full md:max-w-80 h-[30px] px-2 bg-white/10 rounded-lg justify-start items-center gap-2 inline-flex">
      <SearchIcon />
      <input
        className="text-white/50 text-[15px] font-medium   leading-[15px] bg-transparent outline-none w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search..."
      />
    </div>
  )
}

export function FInput({ value, onChange, placeholder }: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="w-full h-[30px] px-2 bg-white/10 rounded-lg flex items-center">
      <input
        className="text-white text-[15px] font-medium   leading-[15px] bg-transparent outline-none w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

const SearchIcon = () => {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M6.08227 0C2.72313 0 0 2.72313 0 6.08227C0 9.44142 2.72313 12.1645 6.08227 12.1645C7.48782 12.1645 8.78201 11.6878 9.81196 10.8872L12.9248 14L14 12.9248L10.8872 9.81196C11.6878 8.78201 12.1645 7.48782 12.1645 6.08227C12.1645 2.72313 9.44142 0 6.08227 0ZM1.52057 6.08227C1.52057 3.56291 3.56291 1.52057 6.08227 1.52057C8.60163 1.52057 10.644 3.56291 10.644 6.08227C10.644 8.60163 8.60163 10.644 6.08227 10.644C3.56291 10.644 1.52057 8.60163 1.52057 6.08227Z" fill="white"/>
    </svg>
  )
}