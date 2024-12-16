import { type Metadata } from "next";
import { App } from "../app";

export const metadata: Metadata = {
  title: "Portfolio",
}

export default function NewPage() {
  return (
    <App initialView="portfolio"/>
  );
}
