"use client";

import { Download, ExternalLink } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Talent } from "./data";

/** The talent's CV (PDF) shown in the page, with open and download links. */
export function CvViewerModal({ talent, onClose }: { talent: Talent | null; onClose: () => void }) {
  if (!talent?.cvUrl) return null;
  // Word files can't be previewed; anything else is tried as a PDF.
  const isPdf = !/\.docx?($|\?)/i.test(talent.cvFileName || talent.cvUrl);

  return (
    <Modal
      open
      onClose={onClose}
      title={`${talent.name}'s CV`}
      subtitle={talent.cvFileName && <p className="text-sm leading-5 text-slate-500">{talent.cvFileName}</p>}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={talent.cvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ variant: "outline-accent", size: "lg", className: "flex-1" })}
          >
            <ExternalLink aria-hidden className="size-4" strokeWidth={1.33} />
            Open in New Tab
          </a>
          <a
            href={talent.cvUrl}
            download={talent.cvFileName || true}
            className={buttonClasses({ variant: "accent", size: "lg", className: "flex-1" })}
          >
            <Download aria-hidden className="size-4" strokeWidth={1.33} />
            Download CV
          </a>
        </div>
      }
    >
      {isPdf ? (
        <>
          <iframe
            src={`${talent.cvUrl}#view=FitH`}
            title={`${talent.name}'s CV`}
            className="h-[65vh] w-full rounded-lg border border-hairline bg-gray-50"
          />
          <p className="text-xs leading-4 text-slate-500">
            If the CV doesn&apos;t appear, its host may block previews. Use Open in New Tab or Download CV.
          </p>
        </>
      ) : (
        <p className="rounded-lg bg-gray-50 p-4 text-sm leading-5 text-slate-700">
          This CV is a Word document, which browsers can&apos;t preview. Download it to read it.
        </p>
      )}
    </Modal>
  );
}
