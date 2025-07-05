<script>
  let faqSections = [
    {
      title: 'CIBUBBLE',
      faqs: [
        {
          question: "WHAT IS CIBUBBLE?",
          answer: "CIBUBBLE IS A FREE, COMMUNITY-CURATED PLATFORM FOR DISCOVERING, RATING, AND TRACKING YOUTUBE VIDEOS AS COMPREHENSIBLE INPUT FOR LANGUAGE LEARNING. LOREM IPSUM DOLOR SIT AMET."
        },
        {
          question: "DO I NEED TO REGISTER TO USE CIBUBBLE?",
          answer: "NO ACCOUNT IS REQUIRED TO BROWSE VIDEOS, BUT YOU'LL NEED TO SIGN UP TO TRACK YOUR PROGRESS, SAVE FAVORITES, AND LOG WATCH TIME. LOREM IPSUM DOLOR SIT AMET."
        },
        {
          question: "IS CIBUBBLE REALLY FREE?",
          answer: "YES. ALL CORE FEATURES ARE FREE. IF YOU FIND CIBUBBLE HELPFUL, YOU CAN SUPPORT US VIA KO-FI OR PATREON. LOREM IPSUM DOLOR SIT AMET."
        },
        {
          question: "HOW DO I ADD OR RATE VIDEOS?",
          answer: "LOG IN, THEN USE THE 'ADD VIDEO' BUTTON OR RATE VIDEOS ON THEIR PAGES. IT’S ALL USER-CURATED. LOREM IPSUM DOLOR SIT AMET."
        },
        {
          question: "HOW CAN I FILTER VIDEOS?",
          answer: "FILTER BY LANGUAGE, LEVEL, CONTENT TYPE, AND RATINGS USING THE MENU ON THE FRONT PAGE. LOREM IPSUM DOLOR SIT AMET."
        }
      ]
    },
    {
      title: 'COMPREHENSIBLE INPUT',
      faqs: [
        {
          question: "WHAT IS 'COMPREHENSIBLE INPUT'?",
          answer: "COMPREHENSIBLE INPUT IS LANGUAGE THAT LEARNERS CAN UNDERSTAND, EVEN IF IT INCLUDES SOME UNFAMILIAR WORDS OR STRUCTURES. IT’S A PROVEN METHOD TO BOOST ACQUISITION. LOREM IPSUM DOLOR SIT AMET."
        },
        {
          question: "WHAT KIND OF VIDEOS COUNT?",
          answer: "VIDEOS MADE FOR LEARNERS OR NATURAL CONTENT THAT’S ACCESSIBLE AT YOUR LEVEL (E.G., EASY VLOGS, SLOW NEWS). LOREM IPSUM DOLOR SIT AMET."
        },
        {
          question: "CAN I SUBMIT MY OWN VIDEOS?",
          answer: "YES! IF THEY FIT THE COMPREHENSIBLE INPUT APPROACH, SUBMIT THEM FOR OTHERS TO DISCOVER. LOREM IPSUM DOLOR SIT AMET."
        },
        {
          question: "WHY DOES CIBUBBLE FOCUS ON COMPREHENSIBLE INPUT?",
          answer: "IT'S ONE OF THE FASTEST, MOST ENJOYABLE WAYS TO LEARN A LANGUAGE, AND IT WORKS FOR ALL LEVELS. LOREM IPSUM DOLOR SIT AMET."
        }
      ]
    }
  ];
</script>

<div class="faq-progress-layout">
  <h1 class="faq-main-title">FAQ</h1>
  {#each faqSections as section}
    <section class="faq-section">
      <h2 class="faq-section-title">{section.title}</h2>
      <div class="faq-grid">
        {#each section.faqs as faq}
          <div class="faq-card">
            <div class="faq-q">{faq.question}</div>
            <div class="faq-a">{faq.answer}</div>
          </div>
        {/each}
      </div>
    </section>
  {/each}
</div>

<style>
  :root {
    --faq-bg: #f7f8fc;
    --faq-card-bg: #fff;
    --faq-card-border: #ededf2;
    --faq-card-shadow: 0 3px 22px 0 #e9eaee18;
    --faq-title: #181d27;
    --faq-section-title: #6c7591;
    --faq-q: #22233a;
    --faq-a: #596080;
  }

  .faq-progress-layout {
    max-width: 900px;
    margin: 2.5em auto 2em auto;
    padding: 0 1.4rem;
    display: flex;
    flex-direction: column;
    gap: 2.3em;
    background: var(--faq-bg);
    border-radius: 24px;
    align-items: stretch;
  }

  .faq-main-title {
    text-transform: uppercase;
    font-size: 2.05rem;
    font-weight: 900;
    letter-spacing: 0.13em;
    margin: 0 0 2.5rem 0;
    text-align: left;
    color: var(--faq-title);
    padding-top: 1.3em;
    padding-bottom: 0;
    padding-left: 0.1em;
    line-height: 1.1;
  }

  .faq-section {
    width: 100%;
    margin-bottom: 2.6rem;
  }

  .faq-section-title {
    text-transform: uppercase;
    font-size: 1.13rem;
    font-weight: 900;
    letter-spacing: 0.13em;
    color: var(--faq-section-title);
    margin-bottom: 1.3rem;
    margin-left: 0.14em;
    padding-top: 0.1em;
    padding-bottom: 0.2em;
  }

  /* FORCED SINGLE COLUMN GRID */
  .faq-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.4em;
    width: 100%;
  }

  .faq-card {
    background: var(--faq-card-bg);
    border-radius: 22px;
    box-shadow: var(--faq-card-shadow);
    padding: 2.1em 2.2em 1.7em 2.2em;
    border: 1.2px solid var(--faq-card-border);
    display: flex;
    flex-direction: column;
    min-width: 0;
    margin-bottom: 0;
    transition: box-shadow 0.17s;
    align-items: flex-start;
  }

  .faq-q {
    font-size: 1.13em;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--faq-q);
    margin-bottom: 0.6em;
    line-height: 1.25;
  }

  .faq-a {
    font-size: 1.01em;
    color: var(--faq-a);
    line-height: 1.65;
    margin-bottom: 0.1em;
    font-weight: 500;
    letter-spacing: 0.01em;
  }

  @media (max-width: 900px) {
    .faq-progress-layout {
      padding: 0 0.5em;
      gap: 1.4em;
      border-radius: 16px;
    }
    .faq-card {
      padding: 1.3em 1.3em 1.1em 1.3em;
      border-radius: 14px;
    }
    .faq-main-title {
      font-size: 1.3rem;
      margin-bottom: 1.1rem;
      padding-top: 0.8em;
    }
    .faq-section-title {
      font-size: 1em;
      margin-bottom: 0.7em;
      padding-top: 0;
    }
  }

  @media (max-width: 600px) {
    .faq-progress-layout {
      padding: 0 0.2em;
      gap: 1.1em;
    }
    .faq-main-title {
      font-size: 1.09rem;
      padding-top: 0.7em;
    }
    .faq-section-title {
      font-size: 0.95em;
    }
    .faq-card {
      padding: 1em 0.9em 0.8em 0.9em;
    }
    .faq-q {
      font-size: 1em;
    }
    .faq-a {
      font-size: 0.97em;
    }
  .faq-page {
    padding: 0 0.17em;
    margin: 1.1em 0 1em 0;
  }

  .faq-main-title {
    font-size: 1.25rem;
    margin-bottom: 1.2rem;
    letter-spacing: 0.09em;
  }

  .faq-section-title {
    font-size: 0.92rem;
    margin-bottom: 0.38rem;
    letter-spacing: 0.11em;
  }

  .faq-grid {
    grid-template-columns: 1fr;
    gap: 0.55rem;
  }

  .faq-card {
    padding: 0.74rem 0.7rem;
    border-radius: 0.9rem;
    box-shadow: 0 2px 10px 0 rgba(30,32,60,0.07);
  }

  .faq-q {
    font-size: 0.93rem;
    margin-bottom: 0.34em;
    letter-spacing: 0.02em;
  }

  .faq-a {
    font-size: 0.85rem;
    line-height: 1.4;
  }
}


  /* Dark mode styling */
  :global(body.dark) {
    --faq-bg: #181d27;
    --faq-card-bg: #232338;
    --faq-card-border: #303054;
    --faq-card-shadow: 0 3px 22px 0 #11111818;
    --faq-title: #fff;
    --faq-section-title: #b6bfd6;
    --faq-q: #fff;
    --faq-a: #bfc3d7;
  }
</style>
