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

<div class="faq-page">
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
  .faq-page {
    max-width: 900px;
    margin: 3rem auto 2rem auto;
    padding: 0 1.2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .faq-main-title {
    text-transform: uppercase;
    font-size: 2.6rem;
    font-weight: 900;
    letter-spacing: 0.11em;
    margin-bottom: 2.2rem;
    text-align: center;
    color: #232338;
  }

  .faq-section {
    width: 100%;
    margin-bottom: 2.5rem;
  }

  .faq-section-title {
    text-transform: uppercase;
    font-size: 1.2rem;
    font-weight: 800;
    letter-spacing: 0.19em;
    color: #676792;
    margin-bottom: 1.1rem;
    margin-left: 0.18em;
  }

  .faq-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.2rem;
  }

  .faq-card {
    background: #fff;
    border-radius: 1.4rem;
    box-shadow: 0 3px 20px 0 rgba(30,32,60,0.09);
    padding: 1.2rem 1.4rem;
    border: 1px solid #f2f2f6;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .faq-q {
    font-size: 1.08rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #313154;
    margin-bottom: 0.6em;
  }

  .faq-a {
    font-size: 1.01rem;
    color: #606075;
    line-height: 1.57;
    margin-bottom: 0.1em;
  }

  @media (max-width: 750px) {
    .faq-grid {
      grid-template-columns: 1fr;
      gap: 0.9rem;
    }
    .faq-card {
      padding: 1.1rem 1rem;
    }
    .faq-section-title {
      font-size: 1.05rem;
      margin-bottom: 0.6rem;
    }
    .faq-main-title {
      font-size: 1.4rem;
      margin-bottom: 1.2rem;
    }
  }

  :global(body.dark) .faq-card {
    background: #232338;
    color: #efeff9;
    border: 1px solid #303054;
  }
  :global(body.dark) .faq-main-title {
    color: #fff;
  }
  :global(body.dark) .faq-section-title {
    color: #aabbee;
  }
  :global(body.dark) .faq-q {
    color: #fff;
  }
  :global(body.dark) .faq-a {
    color: #bfc3d7;
  }
</style>
