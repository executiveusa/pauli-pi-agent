import { i18n } from "../utils/i18n.js";

export class FlipbookComponent extends HTMLElement {
  private currentPage = 0;
  private isRecording = false;
  private isSpeaking = false;
  private isTranscribing = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private activeUtterance: HTMLAudioElement | null = null;

  private pages = [
    {
      title: "1. The Agent Swarm",
      analogy: "An AI Agent is not a chatbot; it is a company. Just like a premium restaurant has a Head Chef (PI CEO), Kitchen Coordinator (PI COO), and specialized Line Cooks (Full-Stack Builders), your Future-Proof Agency divides complex deliverables into organized teammate pipelines.",
      details: "Our Paperclip engine orchestrates 16 distinct agent roles, assigning routines and budgets to achieve monthly recurring revenue targets autonomously."
    },
    {
      title: "2. Deployed Synapses",
      analogy: "Think of your agency as a living nervous system. The BFF backend is the brain, Supabase is the permanent memory vault, Twilio voice APIs are the ears and mouth for receptionist calls, and Postiz is the social publication hand.",
      details: "These synapses are fully wired. Sofia, our UGC Character Concierge, drafts and queues travel campaigns autonomously, while the Lead Engine scores active med-spa prospects."
    },
    {
      title: "3. Token Energy",
      analogy: "Tokens are the electricity of your agency swarms. To keep operational costs virtually zero, we utilize a custom local routing proxy. Lightweight code and chat sweeps are dispatched to free tiers (Groq/Mistral), reserving premium Claude engines only for complex multi-step reasoning.",
      details: "This dual-routing token-saving layer is automated server-side, protecting your local API keys inside gitignored vault environments."
    },
    {
      title: "4. The Sentinel Gate",
      analogy: "Autonomy makes the swarm tireless, but governance makes it secure. Your agents operate under Human-Supervised Autonomy. They scaffold, write, and test code freely in isolated staging sandboxes, but stop at the Bambu gate before moving money, emailing prospects, or publishing live content.",
      details: "This approval sentinel ensures complete brand safety and regulatory compliance while maintaining 24/7 background productivity."
    }
  ];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.setupListeners();
    this.initAudioContext();
  }

  private initAudioContext() {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      this.audioContext = new AudioContextClass();
    }
  }

  private setupListeners() {
    const shadow = this.shadowRoot!;
    
    shadow.querySelector("#prev-btn")?.addEventListener("click", () => this.flipPage(-1));
    shadow.querySelector("#next-btn")?.addEventListener("click", () => this.flipPage(1));
    
    const micBtn = shadow.querySelector("#mic-btn");
    micBtn?.addEventListener("click", () => this.handleMicrophoneToggle());
  }

  private playPageFlipSound() {
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    try {
      // Synthesize a beautiful paper swoosh sound
      const bufferSize = ctx.sampleRate * 0.35;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1; // White noise
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";

      const gain = ctx.createGain();

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      filter.Q.setValueAtTime(4.0, now);
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
      filter.frequency.exponentialRampToValueAtTime(250, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      source.start(now);
      source.stop(now + 0.35);
    } catch (e) {
      console.warn("Audio synthesis error: ", e);
    }
  }

  private flipPage(dir: number) {
    const nextVal = this.currentPage + dir;
    if (nextVal < 0 || nextVal >= this.pages.length) return;
    
    this.playPageFlipSound();
    this.currentPage = nextVal;
    
    // Stop any playing spoken responses on page flip
    if (this.activeUtterance) {
      this.activeUtterance.pause();
      this.activeUtterance = null;
      this.isSpeaking = false;
    }
    
    this.render();
    this.setupListeners();
  }

  private async handleMicrophoneToggle() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  private async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
        await this.sendVoicePayload(audioBlob);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.render();
      this.setupListeners();
    } catch (e) {
      console.error("Microphone access blocked: ", e);
      alert("Please enable microphone permissions in your browser settings.");
    }
  }

  private stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.isRecording = false;
      this.isTranscribing = true;
      this.render();
      this.setupListeners();
    }
  }

  private async sendVoicePayload(blob: Blob) {
    const formData = new FormData();
    formData.append("file", blob, "voice.webm");
    formData.append("pageTitle", this.pages[this.currentPage].title);
    formData.append("contextAnalogy", this.pages[this.currentPage].analogy);

    try {
      const response = await fetch("/api/voice", {
        method: "POST",
        body: formData
      });

      if (!response.ok) throw new Error("Voice synthesis failure");
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      this.isTranscribing = false;
      this.isSpeaking = true;
      this.render();
      this.setupListeners();

      if (this.activeUtterance) this.activeUtterance.pause();
      
      this.activeUtterance = new Audio(audioUrl);
      this.activeUtterance.onended = () => {
        this.isSpeaking = false;
        this.render();
        this.setupListeners();
      };
      
      await this.activeUtterance.play();
    } catch (e) {
      console.error("Voice assistant error: ", e);
      this.isTranscribing = false;
      this.isSpeaking = false;
      this.render();
      this.setupListeners();
      alert("Unable to process voice assistant request. Please check keys.");
    }
  }

  private render() {
    const page = this.pages[this.currentPage];
    
    // Status visual maps
    let statusClass = "idle";
    let statusText = "Tap Mic to Talk to Sophia";
    if (this.isRecording) {
      statusClass = "recording";
      statusText = "Recording Voice Input...";
    } else if (this.isTranscribing) {
      statusClass = "transcribing";
      statusText = "Analyzing & Synthesizing response...";
    } else if (this.isSpeaking) {
      statusClass = "speaking";
      statusText = "Sophia Speaking...";
    }

    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: 'Outfit', sans-serif;
          color: #cdd6f4;
          background: #0f0f15;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          perspective: 1500px;
        }

        .flipbook-container {
          width: 800px;
          height: 520px;
          background: rgba(30, 30, 46, 0.4);
          border: 1px solid rgba(59, 59, 92, 0.5);
          backdrop-filter: blur(16px);
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
          display: flex;
          flex-direction: column;
          padding: 30px;
          position: relative;
          z-index: 10;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .book-spine {
          position: absolute;
          left: 50%;
          top: 0;
          width: 2px;
          height: 100%;
          background: linear-gradient(180deg, transparent, rgba(59, 59, 92, 0.8), transparent);
          transform: translateX(-50%);
        }

        .book-pages {
          display: flex;
          flex: 1;
          gap: 40px;
          position: relative;
        }

        .page-half {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          animation: pageFlipFade 0.5s ease;
        }

        .page-title {
          font-size: 26px;
          font-weight: 700;
          color: #a6e3a1;
          margin-bottom: 20px;
          letter-spacing: -0.5px;
        }

        .analogy-block {
          background: rgba(17, 17, 27, 0.5);
          border-left: 4px solid #f9e2af;
          padding: 16px 20px;
          border-radius: 0 12px 12px 0;
          font-size: 15px;
          line-height: 1.6;
          color: #bac2de;
          margin-bottom: 20px;
        }

        .technical-details {
          font-size: 14px;
          line-height: 1.5;
          color: #9399b2;
        }

        .controls-half {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .voice-ring-container {
          position: relative;
          width: 140px;
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 30px;
        }

        .voice-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid rgba(166, 227, 161, 0.2);
          transition: all 0.3s;
        }

        .voice-ring.recording {
          border-color: rgba(243, 139, 168, 0.6);
          animation: pulseRing 1.5s infinite ease-in-out;
        }

        .voice-ring.speaking {
          border-color: rgba(166, 227, 161, 0.6);
          animation: pulseRing 1s infinite ease-in-out;
        }

        .mic-btn {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: none;
          background: #11111b;
          box-shadow: inset 0 2px 5px rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 20;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .mic-btn:hover {
          transform: scale(1.05);
        }

        .mic-btn.recording {
          background: #f38ba8;
        }

        .mic-btn.speaking {
          background: #a6e3a1;
        }

        .mic-icon {
          font-size: 32px;
          transition: color 0.3s;
        }

        .mic-icon.idle { color: #89b4fa; }
        .mic-icon.recording { color: #11111b; }
        .mic-icon.speaking { color: #11111b; }

        .status-badge {
          font-size: 13px;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 20px;
          background: rgba(17, 17, 27, 0.8);
          border: 1px solid rgba(59, 59, 92, 0.5);
          margin-bottom: 40px;
        }

        .status-badge.recording { color: #f38ba8; border-color: #f38ba8; }
        .status-badge.transcribing { color: #f9e2af; border-color: #f9e2af; }
        .status-badge.speaking { color: #a6e3a1; border-color: #a6e3a1; }

        .navigation-row {
          display: flex;
          justify-content: space-between;
          width: 100%;
          position: absolute;
          bottom: 20px;
          padding: 0 40px;
          box-sizing: border-box;
          z-index: 30;
        }

        .nav-btn {
          background: #181825;
          color: #cdd6f4;
          border: 1px solid rgba(59, 59, 92, 0.4);
          padding: 10px 22px;
          border-radius: 30px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-btn:hover:not(:disabled) {
          background: #313244;
          border-color: #89b4fa;
        }

        .nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .page-indicator {
          font-size: 13px;
          color: #585b70;
          align-self: center;
        }

        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.3); opacity: 0; }
        }

        @keyframes pageFlipFade {
          from { opacity: 0; transform: rotateY(-5deg); }
          to { opacity: 1; transform: rotateY(0deg); }
        }
      </style>

      <div class="flipbook-container" data-testid="voice-flipbook">
        <div class="book-spine"></div>
        
        <div class="book-pages">
          <!-- Left side: Core Analogies & Content -->
          <div class="page-half">
            <div>
              <div class="page-title">${page.title}</div>
              <div class="analogy-block">${page.analogy}</div>
            </div>
            <div class="technical-details">${page.details}</div>
          </div>

          <!-- Right side: Sophia Voice AI Interface -->
          <div class="page-half controls-half">
            <div class="status-badge ${statusClass}">${statusText}</div>
            
            <div class="voice-ring-container">
              <div class="voice-ring ${statusClass}"></div>
              <button id="mic-btn" class="mic-btn ${statusClass}">
                <span class="mic-icon ${statusClass}">🎙️</span>
              </button>
            </div>
            
            <div class="page-indicator">Page ${this.currentPage + 1} of ${this.pages.length}</div>
          </div>
        </div>
      </div>

      <div class="navigation-row">
        <button id="prev-btn" class="nav-btn" ${this.currentPage === 0 ? "disabled" : ""}>
          ◀ Prev
        </button>
        <button id="next-btn" class="nav-btn" ${this.currentPage === this.pages.length - 1 ? "disabled" : ""}>
          Next ▶
        </button>
      </div>
    `;
  }
}

customElements.define("voice-flipbook", FlipbookComponent);
export { FlipbookComponent as VoiceFlipbook };
