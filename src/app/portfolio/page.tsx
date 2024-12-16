import { type Metadata } from "next";
import { App } from "../app";

export const metadata: Metadata = {
  title: "Launch a token",
}

export default function NewPage() {
  return (
    <App initialView="portfolio"/>
  );
}
