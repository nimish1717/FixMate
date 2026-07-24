import { Wrench } from "lucide-react";

export default function SplashScreen({ onComplete }) {
  return (
    <div
      className="splash-root"
      onAnimationEnd={(e) => {
        if (e.animationName === "splash-root-anim") {
          onComplete?.();
        }
      }}
    >
      {/* Animated Background */}
      <div className="bg-circle bg-circle-1" />
      <div className="bg-circle bg-circle-2" />
      <div className="bg-grid" />

      <div className="splash-content">
        <div className="splash-glow-wrap">
          <div className="orbit orbit-1" />
          <div className="orbit orbit-2" />
          <div className="splash-glow" />

          <div className="splash-badge">
            <Wrench
              size={42}
              className="text-[#0f172a] wrench-icon"
              strokeWidth={2.2}
            />
          </div>
        </div>

        <div className="text-center mt-8">
          <h1 className="text-5xl font-bold text-white tracking-tight leading-none mb-3">
            FixKar
          </h1>

          <p className="text-[11px] font-semibold text-blue-300/80 uppercase tracking-[0.28em]">
            Fix karo, apne ghar ke kaam
          </p>
        </div>
      </div>

      <style>{`
        .splash-root{
          position:fixed;
          inset:0;
          z-index:9999;
          overflow:hidden;
          background:#0f172a;
          display:flex;
          align-items:center;
          justify-content:center;
          animation:splash-root-anim 5.2s forwards;
        }

        /* ---------------- BACKGROUND ---------------- */

        .bg-grid{
          position:absolute;
          inset:0;
          opacity:.03;
          background-image:
            linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px);
          background-size:40px 40px;
          animation:gridMove 18s linear infinite;
        }

        .bg-circle{
          position:absolute;
          border-radius:9999px;
          filter:blur(80px);
        }

        .bg-circle-1{
          width:550px;
          height:550px;
          background:rgba(59,130,246,.18);
          top:-180px;
          left:-120px;
          animation:blob1 9s ease-in-out infinite;
        }

        .bg-circle-2{
          width:500px;
          height:500px;
          background:rgba(255,255,255,.08);
          right:-150px;
          bottom:-150px;
          animation:blob2 10s ease-in-out infinite;
        }

        /* ---------------- CONTENT ---------------- */

        .splash-content{
          position:relative;
          display:flex;
          flex-direction:column;
          align-items:center;
          animation:contentAnim 3.8s cubic-bezier(.22,1,.36,1) forwards;
        }

        .splash-glow-wrap{
          position:relative;
          width:120px;
          height:120px;
        }

        .orbit{
          position:absolute;
          inset:-18px;
          border-radius:50%;
          border:1px solid rgba(255,255,255,.08);
        }

        .orbit-1{
          animation:rotate1 10s linear infinite;
        }

        .orbit-2{
          inset:-35px;
          border-color:rgba(255,255,255,.05);
          animation:rotate2 14s linear infinite reverse;
        }

        .orbit::before{
          content:"";
          position:absolute;
          width:8px;
          height:8px;
          background:white;
          border-radius:50%;
          top:-4px;
          left:50%;
          transform:translateX(-50%);
          box-shadow:0 0 14px rgba(255,255,255,.9);
        }

        .splash-glow{
          position:absolute;
          inset:-25px;
          border-radius:36px;
          background:radial-gradient(
            rgba(255,255,255,.25),
            rgba(255,255,255,0)
          );
          filter:blur(20px);
          animation:glowPulse 2s ease-in-out infinite;
        }

        .splash-badge{
          position:absolute;
          inset:0;
          background:#fff;
          border-radius:30px;
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:
            0 0 70px rgba(255,255,255,.12),
            0 18px 60px rgba(0,0,0,.35);
          animation:badgeFloat 3s ease-in-out infinite;
        }

        .wrench-icon{
          animation:wrenchBounce 2s ease infinite;
        }

        h1{
          font-family:'Poppins',sans-serif;
          font-weight:700;
          letter-spacing:-0.03em;
          animation:titleReveal .9s ease .35s both;
        }

        p{
          font-family:'Poppins',sans-serif;
          color:rgba(165,180,252,0.8);
          animation:subtitleReveal .9s ease .6s both;
        }

        /* ---------------- EXIT ---------------- */

        @keyframes splash-root-anim{

          0%,85%{
            opacity:1;
          }

          100%{
            opacity:0;
          }

        }

        @keyframes contentAnim{

          0%{
            opacity:0;
            transform:scale(.72) translateY(40px);
            filter:blur(20px);
          }

          18%{
            opacity:1;
            transform:scale(1) translateY(0);
            filter:blur(0);
          }

          82%{
            opacity:1;
            transform:scale(1);
            filter:blur(0);
          }

          100%{
            opacity:0;
            transform:translateY(-60px) scale(1.08);
            filter:blur(8px);
          }

        }

        /* ---------------- ICON ---------------- */

        @keyframes badgeFloat{

          0%,100%{
            transform:translateY(0);
          }

          50%{
            transform:translateY(-10px);
          }

        }

        @keyframes wrenchBounce{

          0%,100%{
            transform:rotate(0deg);
          }

          20%{
            transform:rotate(-12deg);
          }

          40%{
            transform:rotate(12deg);
          }

          60%{
            transform:rotate(-6deg);
          }

          80%{
            transform:rotate(6deg);
          }

        }

        @keyframes glowPulse{

          0%,100%{
            opacity:.45;
            transform:scale(.95);
          }

          50%{
            opacity:1;
            transform:scale(1.12);
          }

        }

        @keyframes rotate1{

          from{
            transform:rotate(0deg);
          }

          to{
            transform:rotate(360deg);
          }

        }

        @keyframes rotate2{

          from{
            transform:rotate(0deg);
          }

          to{
            transform:rotate(360deg);
          }

        }

        /* ---------------- BACKGROUND ---------------- */

        @keyframes blob1{

          0%,100%{
            transform:translate(0,0) scale(1);
          }

          50%{
            transform:translate(80px,50px) scale(1.15);
          }

        }

        @keyframes blob2{

          0%,100%{
            transform:translate(0,0) scale(1);
          }

          50%{
            transform:translate(-70px,-60px) scale(.9);
          }

        }

        @keyframes gridMove{

          from{
            transform:translateY(0);
          }

          to{
            transform:translateY(40px);
          }

        }

        /* ---------------- TEXT ---------------- */

        @keyframes titleReveal{

          from{
            opacity:0;
            transform:translateY(20px);
            filter:blur(10px);
          }

          to{
            opacity:1;
            transform:none;
            filter:blur(0);
          }

        }

        @keyframes subtitleReveal{

          from{
            opacity:0;
            transform:translateY(10px);
            letter-spacing:.5em;
          }

          to{
            opacity:1;
            transform:none;
            letter-spacing:.28em;
          }

        }

      `}</style>
    </div>
  );
}