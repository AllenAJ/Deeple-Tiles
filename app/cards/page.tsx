export default function CardsPage() {
  return (
    <div className="min-h-[70vh]">
      <header className="relative">
        <img src="/cards/banner.png" alt="Banner" className="w-full h-auto block" />
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4 py-2">
            <div className="font-semibold text-pink-600">Uniswap Card Generator</div>
            <a className="inline-block rounded-full px-4 py-2 text-white" style={{background: 'linear-gradient(180deg,#EC008C,#FF1FA5,#EC008C)'}} href="https://app.uniswap.org" target="_blank" rel="noopener noreferrer">Open Uniswap</a>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <section className="grid gap-7 items-center md:grid-cols-2 md:gap-10">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-2">Limited Edition Uniswap Top Signal Cards</h1>
            <p className="text-muted-foreground mb-4">Generate a personal card and share it. Clean, fast, and minimal.</p>
            <a className="inline-block rounded-full px-4 py-2 text-white" style={{background: 'linear-gradient(180deg,#EC008C,#FF1FA5,#EC008C)'}} href="#">Generate Card</a>
          </div>
          <div className="relative aspect-square w-full max-w-[520px] mx-auto bg-[#FEF4F8] rounded-xl p-4">
            <div className="relative w-full h-full rounded-lg overflow-hidden flex items-center justify-center">
              <img className="absolute inset-auto w-1/2 translate-x-[20%] rotate-[12deg] scale-[0.85] drop-shadow-lg" src="/cards/placeholder-card-back.png" alt="Card back" />
              <img className="relative w-1/2 rounded-lg drop-shadow-xl" src="/cards/placeholder-card.png" alt="Card front" />
            </div>
          </div>
        </section>
      </main>
      <footer className="text-center text-muted-foreground text-xs py-6">
        <small>* Prototype static recreation. Images are placeholders.</small>
      </footer>
    </div>
  );
} 