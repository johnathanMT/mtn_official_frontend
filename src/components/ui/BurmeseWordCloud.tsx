"use client";

/**
 * ============================================================================
 *  BURMESE PROVERBS — cinematic masonry
 * ============================================================================
 *
 *  Same navy as TarotDestiny beneath it, so the two sections read as one
 *  dark field. Proverbs sit in three rings: a gold centrepiece, a supporting
 *  cast, and a quiet atmosphere at the edges. All of it is horizontal.
 *
 *  Content still lives in src/config/proverbs.ts.
 * ============================================================================
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

import { BURMESE_FONT, BURMESE_FONT_WEIGHT, PROVERBS } from "@/config/proverbs";

const VANISH_MS = 5000;

interface WordLayout {
  text: string;
  className: string;
}

const CLUSTER: readonly WordLayout[] = [
  /* ---------------- CENTREPIECES — muted gold ---------------- */
  {
    text: "ကျောပူမှဝမ်းအေး",
    className:
      "top-[40%] left-1/2 z-30 -translate-x-1/2 text-4xl tracking-wide text-[#D4AF37] md:text-6xl",
  },
  {
    text: "လသာတုန်းဗိုင်းငင်",
    className:
      "top-[52%] left-1/2 z-30 -translate-x-1/2 text-2xl tracking-widest text-[#D4AF37] italic md:text-4xl",
  },

  /* ---------------- SUPPORTING CAST — ivory ---------------- */
  {
    text: "ကိုယ့်လှေကိုယ်ထိုး ပဲခူးရောက်ရောက်",
    className:
      "top-[22%] left-1/2 z-20 max-w-[90%] -translate-x-1/2 text-center text-xl leading-snug text-[#FDFBF7] md:text-3xl",
  },
  {
    text: "ဖြစ်ချင်တာဖြစ် မောင်ဘချစ်",
    className:
      "top-[32%] left-[6%] z-20 text-xl text-[#FDFBF7] md:left-[10%] md:text-3xl",
  },
  {
    text: "ရေစီးတခါ ရေသာတစ်လှည့်",
    className:
      "top-[32%] right-[6%] z-20 text-xl text-[#FDFBF7] md:right-[10%] md:text-3xl",
  },
  {
    text: "သစ်တစ်ပင်ကောင်း ငှက်တစ်သောင်းနားနိုင်",
    className:
      "top-[64%] left-1/2 z-20 max-w-[85%] -translate-x-1/2 text-center text-lg leading-snug text-[#FDFBF7] md:text-2xl",
  },
  {
    text: "နေပူတုန်းစပါးလှမ်း",
    className:
      "top-[74%] left-[8%] z-20 text-xl text-[#FDFBF7] md:left-[12%] md:text-2xl",
  },
  {
    text: "အရိပ်မလာခင် နေပူကစောင့်",
    className:
      "top-[74%] right-[8%] z-20 text-xl text-[#FDFBF7] md:right-[12%] md:text-2xl",
  },

  /* ---------------- ATMOSPHERE — ivory, receded ---------------- */
  {
    text: "ဝါးလုံးခေါင်းထဲ လသာ",
    className: "top-[12%] left-[8%] z-10 text-sm text-[#FDFBF7]/40 md:text-base",
  },
  {
    text: "ငရဲရောက်မှ ကျောင်းဆောက်ချင်",
    className: "top-[12%] right-[8%] z-10 text-sm text-[#FDFBF7]/40 md:text-base",
  },
  {
    text: "အရင်းမစိုက် လှေထိုးလိုက်",
    className: "top-[8%] left-1/2 z-10 -translate-x-1/2 text-sm text-[#FDFBF7]/40 md:text-base",
  },
  {
    text: "မမြင်ဖူး မူးမြစ်ထင်",
    className: "top-[48%] left-[5%] z-10 text-sm text-[#FDFBF7]/40 md:text-base",
  },
  {
    text: "ဝက်ဖြစ်တော့မှ မစင်မကြောက်",
    className: "top-[48%] right-[5%] z-10 text-sm text-[#FDFBF7]/40 md:text-base",
  },
  {
    text: "ကြားရဲရာ ကြမ္မာမယိုးသာ",
    className: "bottom-[8%] left-[8%] z-10 text-sm text-[#FDFBF7]/40 md:text-base",
  },
  {
    text: "ဥစ္စာရင်လို ဥစ္စာရင်ခဲ",
    className: "bottom-[8%] right-[8%] z-10 text-sm text-[#FDFBF7]/40 md:text-base",
  },
  {
    text: "ရော့ပတ္တမြား၊ ရော့နဂါး",
    className: "bottom-[4%] left-1/2 z-10 -translate-x-1/2 text-sm text-[#FDFBF7]/40",
  },
  {
    text: "ငုပ်မိသဲတိုင် တတ်နိုင်ဖျားရောက်",
    className: "top-[18%] left-[4%] z-0 text-sm text-[#FDFBF7]/40",
  },
  {
    text: "ငရဲကလာသူ ပြာပူမကြောက်",
    className: "top-[18%] right-[4%] z-0 text-sm text-[#FDFBF7]/40",
  },
  {
    text: "အဝေးတယ်ရှဥ်း၊ အနီးတစ်ရှဥ်း",
    className: "bottom-[18%] left-[4%] z-0 text-sm text-[#FDFBF7]/40",
  },
  {
    text: "မခေါ်လျှင် အထူးရသက်သာ",
    className: "bottom-[18%] right-[4%] z-0 text-sm text-[#FDFBF7]/40",
  },
  {
    text: "နဂိုရီိမှ နဂိုင်းထွက်",
    className: "top-[58%] left-[6%] z-0 text-sm text-[#FDFBF7]/40",
  },
  {
    text: "အလျင်လို လမ်းအိုလိုက်",
    className: "top-[58%] right-[6%] z-0 text-sm text-[#FDFBF7]/40",
  },
  {
    text: "မရွယ်ပဲ စော်ကဲမင်းဖြစ်",
    className: "top-[4%] left-[18%] z-0 text-sm text-[#FDFBF7]/40",
  },
  {
    text: "ရှင်နည်းရာ အဂ္ဂလူထွက်",
    className: "top-[4%] right-[18%] z-0 text-sm text-[#FDFBF7]/40",
  },
];

function InteractiveWord({
  text,
  className,
}: {
  text: string;
  className: string;
}) {
  const [isVisible, setIsVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const vanish = () => {
    if (!isVisible) return;
    setIsVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsVisible(true), VANISH_MS);
  };

  return (
    <motion.div
      lang="my"
      onHoverStart={vanish}
      onTap={vanish}
      animate={{
        opacity: isVisible ? 1 : 0,
        filter: isVisible ? "blur(0px)" : "blur(10px)",
        scale: isVisible ? 1 : 0.8,
      }}
      transition={{ duration: 0.4 }}
      style={{
        fontFamily: BURMESE_FONT,
        fontWeight: BURMESE_FONT_WEIGHT,
        pointerEvents: isVisible ? "auto" : "none",
      }}
      className={`absolute cursor-default select-none ${className}`}
    >
      {text}
    </motion.div>
  );
}

export default function BurmeseWordCloud() {
  return (
    <section
      id="proverbs"
      aria-label="Burmese proverbs"
      className="bg-secondary-900 relative overflow-hidden pt-16 pb-0 lg:pt-24"
    >
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="h-px w-10 shrink-0 bg-[#FDFBF7]/50"
          />
          <h2 className="font-sans text-[0.65rem] font-semibold tracking-[0.22em] text-[#FDFBF7] uppercase">
            စကားပုံ · Burmese Proverbs
          </h2>
        </div>
      </div>

      <div className="relative mx-auto mt-10 h-[500px] w-full overflow-hidden md:mt-14 md:h-[700px]">
        {CLUSTER.map((word) => (
          <InteractiveWord
            key={word.text}
            text={word.text}
            className={word.className}
          />
        ))}
      </div>

      <ul className="sr-only m-0">
        {PROVERBS.map((p) => (
          <li key={p.text} lang="my">
            {p.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
