"use client";

import {
  Frame,
  FrameInfo,
  FrameHeader,
  FrameCloseBtn,
  FrameBody,
  FrameFooter,
} from "@/components/Frame";

import PageHeader from "@/components/page/PageHeader";
import { BackButton } from "@/components/BackButton";

export default function faqDetail() {
  return (
    <>
      <PageHeader>
        <BackButton />
      </PageHeader>
    </>
  );
}
