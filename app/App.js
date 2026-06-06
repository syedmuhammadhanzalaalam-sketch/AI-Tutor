"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
const AI_MODELS = [
  { id: 'openai/gpt-oss-120b',                    name: 'GPT OSS 120B',  badge: 'GPT',    color: '#10a37f', desc: 'Best overall' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', badge: 'META',   color: '#0064e0', desc: 'Strong reasoning' },
  { id: 'google/gemma-2-27b-it:free',             name: 'Gemma 2 27B',   badge: 'GOOGLE', color: '#4285f4', desc: 'Great explanations' },
  { id: 'nvidia/nemotron-70b-instruct:free',       name: 'Nemotron 70B',  badge: 'NVIDIA', color: '#76b900', desc: 'Technical topics' },
  { id: 'qwen/qwen3-30b-a3b:free',                name: 'Qwen3 30B',     badge: 'QWEN',   color: '#ff6b35', desc: 'Coding & math' },
];
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  BrainCircuit, Code2, History, SendHorizontal,
  Plus, Trash2, ClipboardCheck, Map,
  LayoutDashboard, Sparkles, Zap, Volume2, Pause, Play, X,
  // NEW ICONS
  Upload, Mic, MicOff, Sun, Moon, Palette, Search, Copy, Check,
  Settings, User, ChevronDown, ChevronRight, FileText, Image,
  File, AlertCircle, Menu, PanelLeftClose, PanelLeft, Download,
  MessageSquare, Clock, Star,
  // FIXED MENUS
  Pin, MoreVertical, Share, Edit3
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

/* ─── GLOBAL CSS injected once ─── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;600&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ocean: #020d18;
    --abyss: #010810;
    --surface: #041424;
    --glass: rgba(4, 24, 42, 0.7);
    --pulse: #00e5ff;
    --bio: #39ff7a;
    --amber: #ffaa00;
    --coral: #ff6b6b;
    --text: #d0eaf8;
    --muted: #4a7a99;
    --border: rgba(0, 229, 255, 0.08);
    --border-bright: rgba(0, 229, 255, 0.25);
  }

  html, body, #root { height: 100%; overflow: hidden; }
  body {
    background: var(--ocean);
    font-family: 'Syne', sans-serif;
    color: var(--text);
    -webkit-font-smoothing: antialiased;
  }

  /* ── SCROLLBAR ── */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.2); border-radius: 4px; }

  /* ── NEURAL CANVAS BACKGROUND ── */
  .neural-bg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 80% 60% at 15% 40%, rgba(0,100,180,0.12) 0%, transparent 60%),
      radial-gradient(ellipse 60% 80% at 85% 60%, rgba(0,229,255,0.06) 0%, transparent 60%),
      radial-gradient(ellipse 100% 50% at 50% 100%, rgba(57,255,122,0.04) 0%, transparent 50%),
      var(--abyss);
  }
  .neural-bg::before {
    content: '';
    position: absolute; inset: 0;
    background-image:
      radial-gradient(circle 1px at 20% 30%, rgba(0,229,255,0.4) 0%, transparent 100%),
      radial-gradient(circle 1px at 75% 15%, rgba(57,255,122,0.3) 0%, transparent 100%),
      radial-gradient(circle 1px at 55% 70%, rgba(0,229,255,0.25) 0%, transparent 100%),
      radial-gradient(circle 1px at 10% 80%, rgba(57,255,122,0.2) 0%, transparent 100%),
      radial-gradient(circle 1px at 90% 55%, rgba(255,170,0,0.25) 0%, transparent 100%),
      radial-gradient(circle 1px at 40% 10%, rgba(0,229,255,0.3) 0%, transparent 100%);
    animation: starfield 8s ease-in-out infinite alternate;
  }
  @keyframes starfield {
    0%   { opacity: 0.4; transform: translateY(0); }
    100% { opacity: 1; transform: translateY(-4px); }
  }

  /* ── SCANLINE GRAIN ── */
  .grain {
    position: fixed; inset: 0; z-index: 1; pointer-events: none; opacity: 0.025;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 200px;
  }

  /* ── LAYOUT ── */
  .app-shell { position: relative; z-index: 2; display: flex; height: 100vh; }

  /* ── LIGHT THEME OVERRIDES ── */
  .theme-light .neural-bg {
    background:
      radial-gradient(ellipse 80% 60% at 15% 40%, rgba(0,180,220,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 60% 80% at 85% 60%, rgba(0,150,200,0.04) 0%, transparent 60%),
      #f0f7ff;
  }
  .theme-light .grain { opacity: 0.01; }
  .theme-light body { color: #1a2a3a; }

  /* ── SIDEBAR ── */
  .sidebar {
    width: 280px; flex-shrink: 0;
    background: linear-gradient(180deg, rgba(4,20,36,0.98) 0%, rgba(2,13,24,0.98) 100%);
    border-right: 1px solid var(--border-bright);
    display: flex; flex-direction: column;
    padding: 0;
    position: relative;
    backdrop-filter: blur(20px);
    box-shadow: 4px 0 40px rgba(0,0,0,0.6);
    transition: transform 0.3s cubic-bezier(0.4,0,0.2,1), width 0.3s cubic-bezier(0.4,0,0.2,1);
    z-index: 100;
  }
  .sidebar.collapsed { width: 0; overflow: hidden; transform: translateX(-280px); }
  .sidebar::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--pulse), transparent);
    opacity: 0.5;
  }

  .brand {
    padding: 28px 24px 20px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 14px;
  }
  .brand-orb {
    width: 42px; height: 42px; border-radius: 14px;
    background: linear-gradient(135deg, rgba(0,229,255,0.2), rgba(57,255,122,0.15));
    border: 1px solid rgba(0,229,255,0.3);
    display: flex; align-items: center; justify-content: center;
    position: relative;
    box-shadow: 0 0 20px rgba(0,229,255,0.15), inset 0 1px 0 rgba(255,255,255,0.1);
  }
  .brand-orb::after {
    content: '';
    position: absolute; width: 8px; height: 8px; border-radius: 50%;
    background: var(--pulse);
    top: -3px; right: -3px;
    box-shadow: 0 0 8px var(--pulse);
    animation: blink 2s ease-in-out infinite;
  }
  @keyframes blink { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.8); } }

  .brand-name {
    font-size: 20px; font-weight: 800; letter-spacing: -0.5px;
    color: #fff;
  }
  .brand-name span { color: var(--pulse); font-family: 'Instrument Serif', serif; font-style: italic; }

  .new-chat-btn {
    margin: 16px; padding: 13px 18px;
    background: linear-gradient(135deg, rgba(0,229,255,0.1), rgba(57,255,122,0.05));
    border: 1px solid var(--border-bright);
    border-radius: 14px; cursor: pointer;
    display: flex; align-items: center; gap: 10px;
    color: var(--text); font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600;
    transition: all 0.25s;
    position: relative; overflow: hidden;
  }
  .new-chat-btn::before {
    content: ''; position: absolute; inset: 0; border-radius: 14px;
    background: linear-gradient(135deg, rgba(0,229,255,0.15), rgba(57,255,122,0.08));
    opacity: 0; transition: opacity 0.25s;
  }
  .new-chat-btn:hover::before { opacity: 1; }
  .new-chat-btn:hover { border-color: var(--pulse); box-shadow: 0 0 20px rgba(0,229,255,0.15); }

  /* ── SEARCH IN SIDEBAR ── */
  .sidebar-search {
    margin: 0 16px 8px; padding: 9px 14px;
    background: rgba(255,255,255,0.03); border: 1px solid var(--border);
    border-radius: 12px; display: flex; align-items: center; gap: 8px;
    transition: all 0.2s;
  }
  .sidebar-search:focus-within { border-color: var(--pulse); box-shadow: 0 0 12px rgba(0,229,255,0.1); }
  .sidebar-search input {
    flex: 1; background: transparent; border: none; outline: none;
    color: var(--text); font-family: 'Syne', sans-serif; font-size: 12.5px;
  }
  .sidebar-search input::placeholder { color: var(--muted); }

  .nav-scroll { flex: 1; overflow-y: auto; padding: 8px 16px; }
  .nav-section-label {
    font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
    color: var(--muted); padding: 16px 8px 8px; font-weight: 700;
  }

  .nav-item {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 12px; border-radius: 12px; cursor: pointer;
    font-size: 13.5px; font-weight: 600; color: var(--muted);
    transition: all 0.2s; margin-bottom: 2px;
  }
  .nav-item:hover { color: var(--text); background: rgba(0,229,255,0.05); }
  .nav-item .icon-wrap {
    width: 32px; height: 32px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
    transition: all 0.2s; flex-shrink: 0;
  }
  .nav-item:hover .icon-wrap { border-color: rgba(0,229,255,0.2); box-shadow: 0 0 10px rgba(0,229,255,0.1); }

  .session-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 9px 10px; border-radius: 10px; cursor: pointer;
    font-size: 12.5px; color: var(--muted); transition: all 0.2s; margin-bottom: 2px;
    animation: slideIn 0.2s ease-out;
  }
  .session-item:hover .session-menu-btn { opacity: 1 !important; }
  @keyframes slideIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
  .session-item:hover { color: var(--text); background: rgba(255,255,255,0.03); }
  .session-item.active {
    color: var(--pulse); background: rgba(0,229,255,0.06);
    border: 1px solid rgba(0,229,255,0.15);
  }
  .session-title { display: flex; align-items: center; gap: 8px; overflow: hidden; }
  .session-title span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .delete-btn {
    opacity: 0; transition: opacity 0.2s; color: var(--coral);
    background: none; border: none; cursor: pointer; padding: 2px;
    display: flex; align-items: center;
  }
  .session-item:hover .menu-trigger { opacity: 1; }
  .menu-trigger {
    opacity: 0; background: none; border: none; color: var(--muted);
    cursor: pointer; padding: 4px; display: flex; align-items: center;
    transition: all 0.2s;
  }
  .menu-trigger:hover { color: var(--pulse); }

  .chat-options-menu {
    position: absolute; right: 0; top: 30px;
    background: #0a1a2a; border: 1px solid var(--border-bright);
    border-radius: 12px; padding: 6px; z-index: 1000;
    width: 170px; box-shadow: 0 10px 40px rgba(0,0,0,0.8);
    animation: popIn 0.2s ease-out;
  }
  .chat-options-menu button {
    width: 100%; display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; background: none; border: none;
    color: var(--text); font-size: 13px; cursor: pointer;
    border-radius: 8px; transition: 0.2s; font-family: 'Syne', sans-serif;
  }
  .chat-options-menu button:hover { background: rgba(0, 229, 255, 0.1); color: var(--pulse); }
  .chat-options-menu button.danger:hover { background: rgba(255, 107, 107, 0.1); color: var(--coral); }

  /* ── THEME BAR ── */
  .theme-bar {
    padding: 14px 20px; border-top: 1px solid var(--border);
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  }
  .theme-label { font-size: 10px; color: var(--muted); letter-spacing: 1px; flex: 1; }
  .theme-swatch {
    width: 18px; height: 18px; border-radius: 50%; cursor: pointer;
    border: 2px solid transparent; transition: all 0.2s;
  }
  .theme-swatch:hover, .theme-swatch.active { border-color: rgba(255,255,255,0.5); transform: scale(1.15); }

  /* ── LIGHTMODE TOGGLE ── */
  .lightmode-toggle {
    width: 28px; height: 16px; border-radius: 20px;
    background: rgba(255,255,255,0.1); border: 1px solid var(--border-bright);
    cursor: pointer; position: relative; transition: all 0.3s; display: flex; align-items: center; padding: 2px;
  }
  .lightmode-toggle.on { background: rgba(0,229,255,0.3); border-color: var(--pulse); }
  .lightmode-toggle-knob {
    width: 10px; height: 10px; border-radius: 50%; background: var(--muted);
    transition: all 0.3s; position: absolute; left: 2px;
  }
  .lightmode-toggle.on .lightmode-toggle-knob { left: 14px; background: var(--pulse); }

  /* ── MAIN VIEWPORT ── */
  .viewport {
    flex: 1; display: flex; flex-direction: column;
    min-width: 0; position: relative;
    transition: all 0.3s;
  }

  /* ── TOP HEADER BAR ── */
  .top-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px; border-bottom: 1px solid var(--border);
    background: var(--glass); backdrop-filter: blur(20px);
    flex-shrink: 0;
    position: relative;
    z-index: 200;
    overflow: visible;
  }
  .top-bar-left { display: flex; align-items: center; gap: 12px; }
  .sidebar-toggle {
    background: rgba(255,255,255,0.04); border: 1px solid var(--border);
    border-radius: 10px; padding: 8px; cursor: pointer; color: var(--muted);
    display: flex; align-items: center; justify-content: center; transition: all 0.2s;
    flex-shrink: 0;
  }
  .sidebar-toggle:hover { border-color: var(--pulse); color: var(--text); }
  .top-bar-title { font-size: 13px; color: var(--muted); font-weight: 600; letter-spacing: 0.5px; }
  .top-bar-right { display: flex; align-items: center; gap: 10px; }
  .status-dot {
    display: flex; align-items: center; gap: 7px;
    font-size: 11px; color: var(--bio); font-weight: 700; letter-spacing: 1px;
  }
  .status-dot::before {
    content: ''; width: 6px; height: 6px; border-radius: 50%;
    background: var(--bio); box-shadow: 0 0 8px var(--bio);
    animation: blink 1.5s ease-in-out infinite;
  }

  /* ── PROFILE BUTTON ── */
  .profile-btn {
    width: 34px; height: 34px; border-radius: 50%;
    background: linear-gradient(135deg, rgba(0,229,255,0.2), rgba(57,255,122,0.15));
    border: 1px solid var(--border-bright); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; position: relative;
  }
  .profile-btn:hover { border-color: var(--pulse); box-shadow: 0 0 14px rgba(0,229,255,0.2); }

  /* ── SETTINGS PANEL ── */
  .settings-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.2s ease-out;
  }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  .settings-panel {
    background: linear-gradient(145deg, rgba(4,22,40,0.98), rgba(2,13,24,0.98));
    border: 1px solid var(--border-bright); border-radius: 24px;
    padding: 32px; width: 480px; max-width: 90vw; max-height: 80vh; overflow-y: auto;
    box-shadow: 0 24px 80px rgba(0,0,0,0.6);
    animation: popIn 0.25s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes popIn { from { opacity:0; transform:scale(0.92) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
  .settings-title {
    font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 6px;
  }
  .settings-sub { font-size: 13px; color: var(--muted); margin-bottom: 28px; }
  .settings-section { margin-bottom: 24px; }
  .settings-section-label {
    font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
    color: var(--pulse); font-weight: 700; margin-bottom: 14px;
  }
  .settings-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; border-radius: 12px;
    background: rgba(255,255,255,0.03); border: 1px solid var(--border);
    margin-bottom: 8px;
  }
  .settings-row-label { font-size: 13px; color: var(--text); font-weight: 600; }
  .settings-row-sub { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .settings-avatar {
    width: 72px; height: 72px; border-radius: 50%;
    background: linear-gradient(135deg, rgba(0,229,255,0.3), rgba(57,255,122,0.2));
    border: 2px solid var(--border-bright); display: flex; align-items: center;
    justify-content: center; margin: 0 auto 20px;
    box-shadow: 0 0 30px rgba(0,229,255,0.2);
  }
  .settings-name-input {
    width: 100%; background: rgba(255,255,255,0.04); border: 1px solid var(--border);
    border-radius: 12px; padding: 12px 16px; color: var(--text);
    font-family: 'Syne', sans-serif; font-size: 14px; outline: none; transition: all 0.2s;
  }
  .settings-name-input:focus { border-color: var(--pulse); box-shadow: 0 0 12px rgba(0,229,255,0.1); }

  /* ── CHAT STREAM ── */
  .chat-stream {
    flex: 1; overflow-y: auto; padding: 36px;
    display: flex; flex-direction: column; gap: 24px;
  }

  /* ── HERO ── */
  .hero {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; text-align: center;
    padding: 60px 20px; margin: auto;
    max-width: 700px;
  }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 6px 16px; border-radius: 100px;
    border: 1px solid rgba(0,229,255,0.2);
    background: rgba(0,229,255,0.05);
    font-size: 11px; color: var(--pulse); font-weight: 700; letter-spacing: 1.5px;
    margin-bottom: 32px;
  }
  .hero-badge::before {
    content: ''; width: 5px; height: 5px; border-radius: 50%;
    background: var(--pulse); box-shadow: 0 0 6px var(--pulse);
  }
  .hero-title {
    font-family: 'Instrument Serif', serif;
    font-size: clamp(36px, 5vw, 56px);
    line-height: 1.1; letter-spacing: -1px;
    color: #fff; margin-bottom: 16px;
  }
  .hero-title em {
    font-style: italic;
    background: linear-gradient(90deg, var(--pulse), var(--bio));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .hero-sub {
    font-size: 15px; color: var(--muted); max-width: 380px; margin: 0 auto 44px;
    font-weight: 400; line-height: 1.7;
  }
  .hero-cards {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; width: 100%;
  }
  .hero-card {
    padding: 22px 18px;
    background: rgba(4,20,36,0.8);
    border: 1px solid var(--border);
    border-radius: 18px; cursor: pointer; text-align: left;
    transition: all 0.3s;
    position: relative; overflow: hidden;
  }
  .hero-card::before {
    content: ''; position: absolute; inset: 0; border-radius: 18px;
    opacity: 0; transition: opacity 0.3s;
  }
  .hero-card.card-assess::before { background: radial-gradient(circle at 0% 0%, rgba(0,229,255,0.08), transparent 70%); }
  .hero-card.card-road::before  { background: radial-gradient(circle at 0% 0%, rgba(57,255,122,0.08), transparent 70%); }
  .hero-card.card-quiz::before  { background: radial-gradient(circle at 0% 0%, rgba(255,170,0,0.08), transparent 70%); }
  .hero-card:hover { transform: translateY(-4px); border-color: var(--border-bright); }
  .hero-card:hover::before { opacity: 1; }
  .hero-card:hover { box-shadow: 0 12px 40px rgba(0,0,0,0.4); }
  .card-icon {
    width: 38px; height: 38px; border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 14px;
  }
  .card-icon.cyan  { background: rgba(0,229,255,0.1); border: 1px solid rgba(0,229,255,0.2); }
  .card-icon.green { background: rgba(57,255,122,0.1); border: 1px solid rgba(57,255,122,0.2); }
  .card-icon.amber { background: rgba(255,170,0,0.1);  border: 1px solid rgba(255,170,0,0.2); }
  .card-title { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 6px; }
  .card-desc  { font-size: 12px; color: var(--muted); line-height: 1.5; }

  /* ── MESSAGES ── */
  .msg-row { display: flex; animation: msgSlide 0.3s cubic-bezier(0.4,0,0.2,1); }
  @keyframes msgSlide { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  .msg-row.user { justify-content: flex-end; }
  .msg-row.ai   { justify-content: flex-start; }

  .bubble {
    max-width: 78%; border-radius: 20px; padding: 18px 22px;
    position: relative; line-height: 1.7;
    font-size: 14.5px;
  }
  .bubble.user {
    background: linear-gradient(135deg, rgba(0,229,255,0.15), rgba(57,255,122,0.08));
    border: 1px solid rgba(0,229,255,0.2);
    border-bottom-right-radius: 5px;
    color: #e8f8ff;
  }
  .bubble.ai {
    background: rgba(4,22,40,0.9);
    border: 1px solid var(--border);
    border-bottom-left-radius: 5px;
    backdrop-filter: blur(12px);
  }
  .bubble-meta {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 10px;
  }
  .bubble-meta-left { display: flex; align-items: center; gap: 8px; }
  .sender-tag {
    font-size: 9px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;
    color: var(--muted);
  }
  .bubble.ai .sender-tag { color: var(--pulse); }
  .bubble-actions { display: flex; align-items: center; gap: 6px; }
  .voice-btn {
    background: rgba(0,229,255,0.05); border: 1px solid rgba(0,229,255,0.15);
    border-radius: 8px; padding: 5px 8px; cursor: pointer;
    display: flex; align-items: center; gap: 5px;
    transition: all 0.2s;
  }
  .voice-btn:hover { background: rgba(0,229,255,0.12); border-color: var(--pulse); }
  .voice-btn .pause-icon { display: none; }
  .voice-btn:hover .play-icon  { display: none; }
  .voice-btn:hover .pause-icon { display: inline; }

  /* ── COPY BTN ── */
  .copy-btn {
    background: rgba(255,255,255,0.04); border: 1px solid var(--border);
    border-radius: 8px; padding: 5px 8px; cursor: pointer;
    display: flex; align-items: center; gap: 5px; color: var(--muted);
    font-size: 11px; font-family: 'Syne', sans-serif;
    transition: all 0.2s;
  }
  .copy-btn:hover { border-color: var(--pulse); color: var(--pulse); }
  .copy-btn.copied { border-color: var(--bio); color: var(--bio); }

  /* ── FILE ATTACHMENT PREVIEW IN BUBBLE ── */
  .attachment-preview {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; border-radius: 12px; margin-bottom: 10px;
    background: rgba(0,229,255,0.06); border: 1px solid rgba(0,229,255,0.15);
  }
  .attachment-thumb {
    width: 44px; height: 44px; border-radius: 8px; object-fit: cover;
  }
  .attachment-info { flex: 1; min-width: 0; }
  .attachment-name { font-size: 12px; font-weight: 700; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .attachment-size { font-size: 10px; color: var(--muted); margin-top: 2px; }

  /* ── LOADING PULSE ── */
  .loading-row { display: flex; align-items: center; gap: 6px; padding: 4px 8px; }
  .loading-row span {
    width: 7px; height: 7px; border-radius: 50%; background: var(--pulse);
    animation: bounce 1.2s ease-in-out infinite;
    box-shadow: 0 0 6px var(--pulse);
  }
  .loading-row span:nth-child(2) { animation-delay: 0.2s; background: #5be3ff; }
  .loading-row span:nth-child(3) { animation-delay: 0.4s; background: var(--bio); }
  @keyframes bounce {
    0%,80%,100% { transform: translateY(0); opacity: 0.5; }
    40% { transform: translateY(-8px); opacity: 1; }
  }

  /* ── QUIZ ── */
  .quiz-wrap {
    background: rgba(4,22,40,0.95);
    border: 1px solid rgba(255,170,0,0.3);
    border-radius: 22px; padding: 28px;
    box-shadow: 0 0 40px rgba(255,170,0,0.05);
  }
  .quiz-header {
    display: flex; align-items: center; gap: 10px;
    color: var(--amber); margin-bottom: 24px;
    font-size: 16px; font-weight: 700;
  }
  .quiz-q-box { margin-bottom: 22px; }
  .quiz-q-text { color: var(--text); margin-bottom: 12px; font-size: 14px; font-weight: 600; line-height: 1.6; }
  .options-col { display: flex; flex-direction: column; gap: 8px; }
  .quiz-opt {
    text-align: left; padding: 11px 16px;
    background: rgba(255,255,255,0.03); border: 1px solid var(--border);
    border-radius: 11px; color: var(--muted); cursor: pointer; font-size: 13px;
    font-family: 'Syne', sans-serif; transition: all 0.2s;
  }
  .quiz-opt:hover { border-color: rgba(255,170,0,0.3); color: var(--text); }
  .quiz-opt.selected { background: rgba(255,170,0,0.08); border-color: var(--amber); color: var(--amber); }

  /* ── DASHBOARD ── */
  .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .stat-card {
    background: rgba(4,22,40,0.95); border: 1px solid var(--border);
    border-radius: 20px; padding: 28px; text-align: center;
  }
  .stat-label { font-size: 10px; color: var(--muted); letter-spacing: 2px; text-transform: uppercase; font-weight: 700; margin-bottom: 10px; display: block; }
  .stat-value { font-family: 'Instrument Serif', serif; font-size: 48px; color: var(--pulse); line-height: 1; }
  .chart-card { grid-column: span 2; background: rgba(4,22,40,0.95); border: 1px solid var(--border); border-radius: 20px; padding: 24px; }
  .chart-label { font-size: 10px; color: var(--muted); letter-spacing: 2px; text-transform: uppercase; font-weight: 700; margin-bottom: 18px; }
  .dash-close-btn {
    grid-column: span 2; background: transparent;
    border: 1px solid var(--border); border-radius: 12px; padding: 12px;
    color: var(--muted); cursor: pointer; font-family: 'Syne', sans-serif;
    font-size: 13px; transition: all 0.2s;
  }
  .dash-close-btn:hover { border-color: var(--border-bright); color: var(--text); }

  /* ── SKILL PROFILER ── */
  .profiler-box {
    background: rgba(4,22,40,0.95); border: 1px solid var(--border-bright);
    border-radius: 22px; padding: 36px; max-width: 480px; margin: 0 auto;
  }
  .profiler-title { font-family: 'Instrument Serif', serif; font-size: 28px; color: #fff; margin-bottom: 6px; }
  .profiler-sub { font-size: 13px; color: var(--muted); margin-bottom: 30px; }
  .form-group { margin-bottom: 22px; }
  .form-label { display: block; font-size: 11px; color: var(--pulse); letter-spacing: 1.5px; text-transform: uppercase; font-weight: 700; margin-bottom: 10px; }
  .form-input {
    width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--border);
    border-radius: 12px; padding: 13px 16px; color: var(--text);
    font-family: 'Syne', sans-serif; font-size: 14px; outline: none; transition: all 0.2s;
  }
  .form-input:focus { border-color: var(--pulse); box-shadow: 0 0 15px rgba(0,229,255,0.1); }
  .slider-track { width: 100%; accent-color: var(--pulse); cursor: pointer; }
  .slider-labels { display: flex; justify-content: space-between; margin-top: 6px; }
  .slider-label-text { font-size: 11px; color: var(--muted); }

  /* ── SUBMIT / ACTION BUTTONS ── */
  .action-btn {
    width: 100%; padding: 15px; border: none; border-radius: 14px;
    cursor: pointer; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
    transition: all 0.25s; position: relative; overflow: hidden;
  }
  .action-btn.primary {
    background: linear-gradient(135deg, rgba(0,229,255,0.9), rgba(57,255,122,0.8));
    color: #010810;
    box-shadow: 0 4px 20px rgba(0,229,255,0.25);
  }
  .action-btn.primary:hover { box-shadow: 0 6px 30px rgba(0,229,255,0.4); transform: translateY(-1px); }
  .action-btn.danger { background: rgba(255,107,107,0.1); border: 1px solid rgba(255,107,107,0.3); color: var(--coral); }
  .action-btn.quiz-submit { background: rgba(255,170,0,0.12); border: 1px solid rgba(255,170,0,0.3); color: var(--amber); margin-top: 16px; }
  .action-btn.quiz-submit:hover { background: rgba(255,170,0,0.2); }

  /* ── INPUT AREA ── */
  .input-area { padding: 16px 36px 28px; position: relative; }

  /* ── FILE PREVIEW STRIP ── */
  .file-preview-strip {
    display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; padding: 0 4px;
  }
  .file-preview-chip {
    display: flex; align-items: center; gap: 6px;
    background: rgba(4,22,40,0.95); border: 1px solid var(--border-bright);
    border-radius: 10px; padding: 5px 10px; font-size: 11px; color: var(--text);
    position: relative; max-width: 160px; animation: chipIn 0.2s ease-out;
  }
  @keyframes chipIn { from { opacity:0; transform:scale(0.85); } to { opacity:1; transform:scale(1); } }
  .file-preview-chip img { width: 28px; height: 28px; border-radius: 5px; object-fit: cover; }
  .file-preview-chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
  .file-chip-remove {
    background: none; border: none; cursor: pointer; color: var(--coral);
    padding: 0; display: flex; align-items: center; flex-shrink: 0;
  }
  
  .input-shell {
    display: flex; align-items: center; gap: 10px;
    background: rgba(4,22,40,0.95); border: 1px solid var(--border-bright);
    border-radius: 18px; padding: 8px 8px 8px 20px;
    transition: all 0.25s;
    box-shadow: 0 4px 30px rgba(0,0,0,0.3), 0 0 0 1px var(--border);
  }
  .input-shell:focus-within {
    border-color: var(--pulse);
    box-shadow: 0 4px 30px rgba(0,0,0,0.3), 0 0 20px rgba(0,229,255,0.12);
  }
  .chat-input {
    flex: 1; background: transparent; border: none; outline: none;
    color: var(--text); font-family: 'Syne', sans-serif; font-size: 14.5px;
    height: 44px;
    placeholder-color: var(--muted);
  }
  .chat-input::placeholder { color: var(--muted); }

  /* ── INPUT TOOL BTNS ── */
  .input-tool-btn {
    width: 38px; height: 38px; border-radius: 10px;
    background: rgba(255,255,255,0.04); border: 1px solid var(--border);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; flex-shrink: 0; color: var(--muted);
  }
  .input-tool-btn:hover { border-color: var(--pulse); color: var(--pulse); box-shadow: 0 0 10px rgba(0,229,255,0.1); }
  .input-tool-btn.active { border-color: var(--coral); color: var(--coral); background: rgba(255,107,107,0.08); animation: pulse-ring 1s ease-in-out infinite; }
  @keyframes pulse-ring { 0%,100% { box-shadow: 0 0 0 0 rgba(255,107,107,0.3); } 50% { box-shadow: 0 0 0 6px rgba(255,107,107,0); } }

  .send-btn {
    width: 44px; height: 44px; border-radius: 12px;
    background: linear-gradient(135deg, var(--pulse), var(--bio));
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; flex-shrink: 0;
    box-shadow: 0 0 16px rgba(0,229,255,0.3);
  }
  .send-btn:hover { transform: scale(1.05); box-shadow: 0 0 24px rgba(0,229,255,0.5); }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  /* ── CODE BLOCKS ── */
  .inline-code {
    background: rgba(0,229,255,0.08); padding: 2px 6px;
    border-radius: 5px; color: var(--pulse);
    font-family: 'JetBrains Mono', monospace; font-size: 0.88em;
  }
  .code-block-wrapper { position: relative; }
  .code-copy-btn {
    position: absolute; top: 10px; right: 10px; z-index: 10;
    background: rgba(4,22,40,0.85); border: 1px solid var(--border-bright);
    border-radius: 7px; padding: 4px 10px; cursor: pointer;
    color: var(--muted); font-size: 11px; font-family: 'Syne', sans-serif;
    display: flex; align-items: center; gap: 5px; transition: all 0.2s;
  }
  .code-copy-btn:hover { border-color: var(--pulse); color: var(--pulse); }
  .code-copy-btn.copied { border-color: var(--bio); color: var(--bio); }

  /* ── MARKDOWN PROSE ── */
  .bubble.ai p  { margin-bottom: 10px; }
  .bubble.ai h1,.bubble.ai h2,.bubble.ai h3 {
    color: #fff; margin: 16px 0 8px; font-family: 'Instrument Serif', serif;
  }
  .bubble.ai ul, .bubble.ai ol { padding-left: 20px; margin-bottom: 10px; }
  .bubble.ai li { margin-bottom: 4px; }
  .bubble.ai strong { color: #fff; }
  .bubble.ai a { color: var(--pulse); text-decoration: underline; }

  /* ── VOICE RECORDING INDICATOR ── */
  .voice-indicator {
    display: flex; align-items: center; gap: 8px; padding: 4px 12px;
    color: var(--coral); font-size: 12px; font-weight: 700;
  }
  .voice-wave { display: flex; gap: 3px; align-items: center; }
  .voice-wave span {
    width: 3px; border-radius: 3px; background: var(--coral);
    animation: waveBar 0.8s ease-in-out infinite;
  }
  .voice-wave span:nth-child(1) { height: 8px; animation-delay: 0s; }
  .voice-wave span:nth-child(2) { height: 14px; animation-delay: 0.1s; }
  .voice-wave span:nth-child(3) { height: 10px; animation-delay: 0.2s; }
  .voice-wave span:nth-child(4) { height: 16px; animation-delay: 0.15s; }
  .voice-wave span:nth-child(5) { height: 8px; animation-delay: 0.05s; }
  @keyframes waveBar { 0%,100% { transform: scaleY(0.5); opacity:0.6; } 50% { transform: scaleY(1); opacity:1; } }

  /* ── MOBILE RESPONSIVE ── */
  @media (max-width: 768px) {
    .sidebar {
      position: fixed; top: 0; left: 0; height: 100vh;
      transform: translateX(-280px); z-index: 500;
      box-shadow: 8px 0 40px rgba(0,0,0,0.8);
    }
    .sidebar.mobile-open { transform: translateX(0); }
    .top-bar { padding: 12px 16px; }
    .chat-stream { padding: 16px; }
    .input-area { padding: 10px 16px 20px; }
    .hero-cards { grid-template-columns: 1fr; }
    .bubble { max-width: 92%; }
    .status-dot { display: none; }
  }
  @media (max-width: 480px) {
    .settings-panel { padding: 24px; border-radius: 20px; }
    .hero-title { font-size: 28px; }
  }

  /* ── SEARCH HIGHLIGHT ── */
  .search-highlight { background: rgba(0,229,255,0.25); border-radius: 2px; padding: 0 1px; }

  /* ── TOAST NOTIFICATION ── */
  .toast {
    position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
    background: rgba(4,22,40,0.97); border: 1px solid var(--bio);
    border-radius: 12px; padding: 10px 20px; z-index: 9999;
    font-size: 12.5px; color: var(--bio); font-weight: 700;
    animation: toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
    box-shadow: 0 8px 30px rgba(0,0,0,0.5);
  }
  @keyframes toastIn { from { opacity:0; transform: translateX(-50%) translateY(10px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }

  /* ── MOBILE OVERLAY ── */
  .sidebar-overlay {
    display: none; position: fixed; inset: 0; z-index: 499;
    background: rgba(0,0,0,0.5);
  }
  @media (max-width: 768px) {
    .sidebar-overlay.visible { display: block; }
  }
`;

/* ─── THEMES ─── */
const THEMES = {
  ocean: {
    '--ocean': '#020d18', '--abyss': '#010810', '--surface': '#041424',
    '--pulse': '#00e5ff', '--bio': '#39ff7a', '--muted': '#4a7a99',
    '--border': 'rgba(0, 229, 255, 0.08)', '--border-bright': 'rgba(0, 229, 255, 0.25)',
  },
  void: {
    '--ocean': '#09060f', '--abyss': '#040208', '--surface': '#120a1e',
    '--pulse': '#bf5fff', '--bio': '#ff6ef7', '--muted': '#6a4a7a',
    '--border': 'rgba(191, 95, 255, 0.08)', '--border-bright': 'rgba(191, 95, 255, 0.25)',
  },
  ember: {
    '--ocean': '#120800', '--abyss': '#0a0400', '--surface': '#1e0d00',
    '--pulse': '#ff6b35', '--bio': '#ffd700', '--muted': '#7a4a30',
    '--border': 'rgba(255, 107, 53, 0.08)', '--border-bright': 'rgba(255, 107, 53, 0.25)',
  },
  maroon: {
    '--ocean': '#100008', '--abyss': '#080004', '--surface': '#1a000d',
    '--pulse': '#e0003c', '--bio': '#ff6699', '--muted': '#7a2040',
    '--border': 'rgba(224, 0, 60, 0.08)', '--border-bright': 'rgba(224, 0, 60, 0.25)',
  },
  light: {
    '--ocean': '#f0f7ff', '--abyss': '#e4f0fa', '--surface': '#ddeeff',
    '--pulse': '#0077cc', '--bio': '#00aa55', '--muted': '#5588aa',
    '--border': 'rgba(0, 119, 204, 0.1)', '--border-bright': 'rgba(0, 119, 204, 0.3)',
    '--text': '#1a2a3a', '--glass': 'rgba(220,238,255,0.7)',
  },
};

/* ─── THEME SWATCH COLORS ─── */
const SWATCH_COLORS = {
  ocean: '#00e5ff',
  void: '#bf5fff',
  ember: '#ff6b35',
  maroon: '#e0003c',
  light: '#0077cc',
};

/* ─── COPY BUTTON COMPONENT ─── */
const CopyButton = ({ text, className = 'copy-btn', small = false }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button className={`${className} ${copied ? 'copied' : ''}`} onClick={handleCopy} title="Copy">
      {copied ? <Check size={small ? 11 : 12} /> : <Copy size={small ? 11 : 12} />}
      {!small && <span>{copied ? 'Copied!' : 'Copy'}</span>}
    </button>
  );
};

/* ─── FILE ICON ─── */
const FileIcon = ({ type }) => {
  if (type?.startsWith('image/')) return <Image size={14} color="var(--pulse)" />;
  if (type?.includes('pdf')) return <FileText size={14} color="var(--coral)" />;
  return <File size={14} color="var(--bio)" />;
};

/* ─── FORMAT BYTES ─── */
const formatBytes = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

/* ─── COMPONENT ─── */
const App = () => {
  /* ── ORIGINAL STATE ── */
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [chat, setChat] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [stats, setStats] = useState({ average_score: 0, total_modules: 0, completed_modules: 0, recent_scores: [] });
  const [showDashboard, setShowDashboard] = useState(false);
  const [interviewMode, setInterviewMode] = useState(false);
  const [interviewData, setInterviewData] = useState({ topic: '', grip: 3, efficiency: 3, experience: 'Intermediate' });
  const [theme, setTheme] = useState('ocean');
  const chatEndRef = useRef(null);
  const [promptSuggestions, setPromptSuggestions] = useState([]);
  const enhancementTimer = useRef(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [stagedFile, setStagedFile] = useState(null);
  const [activeMenuSessionId, setActiveMenuSessionId] = useState(null);

  /* ── NEW STATE ── */

  /* ── NEW STATE ── */
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [userName, setUserName] = useState('Hanzala');
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);  // files pending send
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  /* ── RESIZE LISTENER ── */
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ── TOAST HELPER ── */
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  /* ── ORIGINAL VOICE (TTS) ── */
  const handleSpeak = (text) => {
    window.speechSynthesis.cancel();
    const clean = text.replace(/[#*`_]/g, '').replace(/\[.*?\]/g, '');
    const utt = new window.SpeechSynthesisUtterance(clean);
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => (v.name.includes('Google') || v.name.includes('Microsoft')) && v.lang.startsWith('en')) || voices[0];
    if (v) utt.voice = v;
    utt.pitch = 0.95; utt.rate = 0.9;
    window.speechSynthesis.speak(utt);
  };
  const handleStop = () => window.speechSynthesis.cancel();

  /* ── VOICE INPUT (STT) ── */
  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      showToast('Voice input not supported in this browser');
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setUserInput(prev => prev + (prev ? ' ' : '') + transcript);
      setIsRecording(false);
    };
    recognition.onerror = () => { setIsRecording(false); showToast('Voice recognition error'); };
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  /* ── FILE UPLOAD ── */
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const withPreviews = files.map(f => ({
      file: f,
      name: f.name,
      size: f.size,
      type: f.type,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
    }));
    setUploadedFiles(prev => [...prev, ...withPreviews]);
    e.target.value = '';
  };

  const removeFile = (idx) => {
    setUploadedFiles(prev => {
      const updated = [...prev];
      if (updated[idx].preview) URL.revokeObjectURL(updated[idx].preview);
      updated.splice(idx, 1);
      return updated;
    });
  };

  /* ── ORIGINAL EFFECTS ── */
  useEffect(() => {
    fetchSessions();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      window.speechSynthesis.cancel();
      fetch(`/api/chat/${currentSessionId}`)
        .then(r => r.json()).then(setChat);
    }
  }, [currentSessionId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat, activeQuiz, interviewMode, loading]);

  useEffect(() => {
    if (userInput.length > 10) {
      setShowSuggestions(true);
      if (enhancementTimer.current) clearTimeout(enhancementTimer.current);
      enhancementTimer.current = setTimeout(async () => {
        try {
          const response = await fetch('/api/enhance-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userInput }),
          }).then(r => r.json());
          setPromptSuggestions(response.suggestions || []);
        } catch (err) {
          console.error("Enhancement failed", err);
        }
      }, 1200);
    } else {
      setPromptSuggestions([]);
    }
  }, [userInput]);

  /* ── ORIGINAL API FUNCTIONS ── */
  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('fetchSessions error:', e);
      setSessions([]);
    }
  };

  const createNewChat = async () => {
    const s = await fetch('/api/sessions', { method: 'POST' }).then(r => r.json());
    setSessions([s, ...sessions]); setCurrentSessionId(s.id); setChat([]);
    setShowDashboard(false); setInterviewMode(false);
    if (isMobile) setMobileSidebarOpen(false);
  };

  const deleteSession = async (e, id) => {
    e.stopPropagation();
    await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (currentSessionId === id) { setCurrentSessionId(null); setChat([]); setShowDashboard(false); setInterviewMode(false); setActiveQuiz(null); }
  };

  const startAssessment = async () => {
    const topic = prompt('Define your learning objective:');
    if (!topic || !currentSessionId) return;
    setLoading(true);
    try {
      const data = await fetch('/api/assess', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      }).then(r => r.json());
      setChat(prev => [...prev, { sender: 'User', message: `Start Assessment: ${topic}` }, { sender: 'AI_Tutor', message: data.assessment }]);
    } finally { setLoading(false); }
  };

  const generatePath = () => {
    if (!currentSessionId) return alert('Select a chat first!');
    setShowDashboard(false); setActiveQuiz(null); setInterviewMode(true);
  };

  const handleFinishInterview = async () => {
    if (!interviewData.topic.trim()) return alert('Please enter a topic domain!');
    setLoading(true); setInterviewMode(false);
    try {
      await fetch('/api/save-profile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: currentSessionId, ...interviewData }),
      });
      const data = await fetch('/api/generate-curriculum', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: interviewData.topic }),
      }).then(r => r.json());
      setChat(prev => [...prev, { sender: 'AI_Tutor', message: `### 🎯 Your Roadmap\n**${interviewData.topic}**\n\n${data.curriculum}` }]);
    } catch { alert('Error compiling roadmap.'); } finally { setLoading(false); }
  };

  const takeQuiz = async () => {
    if (!currentSessionId) return alert('Select a chat first!');
    const topic = prompt('Enter topic for quiz:');
    if (!topic) return;
    setLoading(true);
    try {
      const data = await fetch('/api/quiz', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: currentSessionId, topic }),
      }).then(r => r.json());
      const questions = data.quiz.split('---').filter(b => b.trim()).map(block => {
        const lines = block.trim().split('\n');
        const fi = lines.findIndex(l => l.match(/^[A-C]\)/i));
        return {
          question: lines.slice(0, fi).join('\n'),
          options: lines.filter(l => l.match(/^[A-C]\)/i)),
          correct: lines.find(l => l.toLowerCase().includes('correct:'))?.split(':')[1].trim().charAt(0).toUpperCase() || 'A',
        };
      });
      setActiveQuiz(questions); setUserAnswers({}); setShowDashboard(false);
    } finally { setLoading(false); }
  };

  const submitQuiz = async () => {
    let correct = 0;
    activeQuiz.forEach((q, i) => { if (userAnswers[i] === q.correct) correct++; });
    const score = Math.round((correct / activeQuiz.length) * 100);
    await fetch('/api/quiz/score', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, difficulty: 'Dynamic' }),
    });
    setChat(prev => [...prev, { sender: 'AI_Tutor', message: `### 🏁 Session Complete\nScore: **${score}%** — ${score >= 70 ? 'Excellent calibration.' : 'Learn to grow.'}` }]);
    setActiveQuiz(null); setUserAnswers({});
  };

  const fetchProgress = async () => {
    const data = await fetch('/api/progress').then(r => r.json());
    setStats(data);
    if (data.recent_scores) {
      setChartData([...data.recent_scores].reverse().map((score, i) => ({ attempt: `T${i + 1}`, score })));
    }
    setActiveQuiz(null); setInterviewMode(false); setShowDashboard(true);
  };

  const exportChatAsPDF = async () => {
    const chatMessages = chat.filter(m => m.message);
    if (chatMessages.length === 0) return;

    const mdToHtml = (text) => {
      let html = text
        // Tables
        .replace(/^\|(.+)\|$/gm, (_, row) => {
          const cells = row.split('|').map(c => c.trim());
          return '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
        })
        .replace(/^\|[-| :]+\|$/gm, '')
        // Wrap consecutive <tr> in <table>
        .replace(/((<tr>.*<\/tr>\n?)+)/g, '<table>$1</table>')
        // Headings
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // Bold + italic
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Code blocks
        .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        // Blockquote
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        // Horizontal rule
        .replace(/^---+$/gm, '<hr/>')
        // Ordered list
        .replace(/^\d+\. (.+)$/gm, '<li class="ol">$1</li>')
        .replace(/(<li class="ol">.*<\/li>\n?)+/g, m => `<ol>${m.replace(/ class="ol"/g, '')}</ol>`)
        // Unordered list
        .replace(/^[-*] (.+)$/gm, '<li class="ul">$1</li>')
        .replace(/(<li class="ul">.*<\/li>\n?)+/g, m => `<ul>${m.replace(/ class="ul"/g, '')}</ul>`)
        // YouTube link card
        .replace(/\[(.+?)\]\((https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^\)]*)\)/g,
          '<a href="$2" style="color:#0ea5e9;">▶ $1</a>')
        // Regular links
        .replace(/\[(.+?)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2">$1</a>')
        // Paragraphs — wrap lines not already wrapped in tags
        .split('\n')
        .map(line => {
          const trimmed = line.trim();
          if (!trimmed) return '';
          if (/^<(h[1-6]|ul|ol|li|table|tr|td|th|pre|blockquote|hr|div)/.test(trimmed)) return trimmed;
          return `<p>${trimmed}</p>`;
        })
        .join('\n');
      return html;
    };

    const sessionTitle = sessions.find(s => s.id === currentSessionId)?.title || 'Chat Session';

    const htmlContent = `
      <div style="font-family: 'Georgia', serif; padding: 50px 60px; max-width: 900px; background: #ffffff; color: #1a1a2e;">

        <!-- Header -->
        <div style="text-align:center; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 4px solid #00b4d8;">
          <div style="font-size:11px; letter-spacing:4px; color:#00b4d8; font-family:Arial,sans-serif; font-weight:800; margin-bottom:10px;">
            HANZALA AI TUTOR
          </div>
          <h1 style="font-size:30px; color:#0a0f2e; margin:0 0 8px; font-family:Arial,sans-serif; font-weight:900;">
            ${sessionTitle}
          </h1>
          <p style="color:#888; font-size:13px; margin:0; font-family:Arial,sans-serif;">
            Study Notes Export &nbsp;·&nbsp; ${new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </p>
        </div>

        <!-- Messages -->
        ${chatMessages.map((m) => `
          <div style="margin-bottom:24px; border-radius:16px; overflow:hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.07);">

            <!-- Sender label -->
            <div style="
              padding: 10px 20px;
              background: ${m.sender === 'User' ? '#e0f2fe' : '#0a0f2e'};
              display:flex; align-items:center; gap:8px;
            ">
              <span style="font-size:14px;">${m.sender === 'User' ? '👤' : '🤖'}</span>
              <span style="
                font-size:11px; font-weight:800; letter-spacing:2px;
                font-family:Arial,sans-serif;
                color: ${m.sender === 'User' ? '#0369a1' : '#00e5ff'};
              ">
                ${m.sender === 'User' ? 'YOU' : 'HANZALA AI'}
              </span>
            </div>

            <!-- Message body -->
            <div style="
              padding: 20px 24px;
              background: ${m.sender === 'User' ? '#f0f9ff' : '#f9fafb'};
              font-size:14px; line-height:1.9; color:#1a1a2e;
              font-family: Arial, sans-serif;
            ">
              <style>
                h1 { font-size:20px; color:#0a0f2e; margin:16px 0 8px; }
                h2 { font-size:17px; color:#0a0f2e; margin:14px 0 6px; border-bottom:1px solid #e2e8f0; padding-bottom:4px; }
                h3 { font-size:15px; color:#0369a1; margin:12px 0 5px; }
                p  { margin:6px 0; }
                strong { color:#0a0f2e; }
                em { color:#0369a1; font-style:italic; }
                code { background:#e2e8f0; padding:2px 7px; border-radius:5px; font-family:monospace; font-size:13px; color:#be185d; }
                pre { background:#1e293b; color:#e2e8f0; padding:16px 20px; border-radius:10px; font-family:monospace; font-size:12px; overflow:auto; margin:12px 0; }
                pre code { background:none; color:#e2e8f0; padding:0; }
                table { width:100%; border-collapse:collapse; margin:14px 0; font-size:13px; }
                tr:nth-child(even) { background:#f1f5f9; }
                td, th { padding:10px 14px; border:1px solid #cbd5e1; text-align:left; vertical-align:top; }
                th { background:#0a0f2e; color:#ffffff; font-weight:700; font-size:11px; letter-spacing:0.5px; }
                ul { padding-left:22px; margin:8px 0; }
                ol { padding-left:22px; margin:8px 0; }
                li { margin:4px 0; line-height:1.7; }
                blockquote { border-left:4px solid #00b4d8; margin:12px 0; padding:10px 16px; background:#f0f9ff; color:#334155; border-radius:0 8px 8px 0; }
                hr { border:none; border-top:1px solid #e2e8f0; margin:16px 0; }
                a { color:#0ea5e9; }
              </style>
              ${mdToHtml(m.message)}
            </div>
          </div>
        `).join('')}

        <!-- Footer -->
        <div style="text-align:center; margin-top:50px; padding-top:20px; border-top:2px solid #e2e8f0;">
          <p style="color:#aaa; font-size:12px; font-family:Arial,sans-serif; margin:0;">
            Generated by <strong style="color:#00b4d8;">Hanzala AI Tutor</strong> &nbsp;·&nbsp; ${new Date().toLocaleString()}
          </p>
        </div>

      </div>
    `;

    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:900px;background:#fff;';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 900,
        windowWidth: 900,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${sessionTitle.replace(/[^a-z0-9]/gi, '_')}_study_notes.pdf`);
    } finally {
      document.body.removeChild(container);
    }
  };

  const sendToAI = async () => {
    if ((!userInput.trim() && !stagedFile) || !currentSessionId) return;

    const msg = userInput;
    const fileToSend = stagedFile;
    setUserInput('');
    setStagedFile(null);
    setLoading(true);

    setChat(prev => [...prev, { sender: 'User', message: fileToSend ? `[File: ${fileToSend.name}] ${msg}` : msg }]);

    try {
      if (fileToSend) {
        // File upload — no streaming
        const formData = new FormData();
        formData.append('file', fileToSend);
        formData.append('session_id', currentSessionId);
        formData.append('message', msg || 'Analyze this file');
        const resp = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await resp.json();
        setLoading(false);
        setChat(prev => [...prev, { sender: 'AI_Tutor', message: data.reply || 'Error: No response' }]);
      } else {
        const resp = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg, session_id: currentSessionId, model: selectedModel.id }),
        });

        const data = await resp.json();
        const fullReply = data.reply || 'Error: No response';

        const aiText = fullReply;
        const ytPart = '';

        setLoading(false);
        setChat(prev => [...prev, { sender: 'AI_Tutor', message: '' }]);

        // Type only the AI text part word by word
        const words = aiText.split(' ');
        let built = '';
        for (let i = 0; i < words.length; i++) {
          built += (i === 0 ? '' : ' ') + words[i];
          const snapshot = built;
          await new Promise(r => setTimeout(r, 12));
          setChat(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              sender: 'AI_Tutor',
              message: snapshot + (i < words.length - 1 ? ' ▍' : '')
            };
            return updated;
          });
        }

        // Final — show complete message including YouTube card
        setChat(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { sender: 'AI_Tutor', message: aiText + ytPart };
          return updated;
        });
      }

      fetchSessions();
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
      setChat(prev => [...prev, { sender: 'AI_Tutor', message: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const createNewWithPrompt = async () => {
    if (!userInput.trim()) return;
    setLoading(true);
    try {
      const s = await fetch('/api/sessions', { method: 'POST' }).then(r => r.json());
      setSessions([s, ...sessions]);
      setCurrentSessionId(s.id);
      const msg = userInput;
      setUserInput('');
      const data = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, session_id: s.id }),
      }).then(r => r.json());
      setChat([{ sender: 'User', message: msg }, { sender: 'AI_Tutor', message: data.reply }]);
      
      // REFRESH SIDEBAR TITLES
      fetchSessions();
    } catch (err) {
      console.error("Auto-start failed", err);
    } finally { setLoading(false); }
  };

  /* ── FILTERED SESSIONS (search) ── */
  const filteredSessions = sessions.filter(s =>
    !searchQuery || s.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentTheme = THEMES[theme];
  const themeVars = Object.entries(currentTheme).map(([k, v]) => `${k}: ${v};`).join(' ');

  /* ── LIGHT THEME EXTRA CSS ── */
  const lightThemeCSS = theme === 'light' ? `
    body { color: #1a2a3a !important; }
    .neural-bg { background: radial-gradient(ellipse 80% 60% at 15% 40%, rgba(0,100,180,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 85% 60%, rgba(0,119,204,0.04) 0%, transparent 60%), #f0f7ff !important; }
    .neural-bg::before { opacity: 0.15 !important; }
    .sidebar { background: linear-gradient(180deg, rgba(225,238,252,0.99) 0%, rgba(210,230,248,0.99) 100%) !important; }
    .bubble.ai { background: rgba(225,240,255,0.95) !important; color: #1a2a3a !important; }
    .bubble.user { background: linear-gradient(135deg, rgba(0,119,204,0.15), rgba(0,170,85,0.08)) !important; color: #0a1a2a !important; }
    .input-shell { background: rgba(220,238,255,0.97) !important; }
    .chat-input { color: #1a2a3a !important; }
    .top-bar { background: rgba(220,235,252,0.7) !important; }
    .settings-panel { background: linear-gradient(145deg, rgba(225,240,255,0.99), rgba(210,228,248,0.99)) !important; }
    .new-chat-btn, .nav-item { color: #1a2a3a !important; }
    .session-item { color: #2a4a6a !important; }
    .brand-name { color: #0a1a2a !important; }
    .hero-title { color: #0a1a2a !important; }
    .hero-card { background: rgba(220,238,255,0.8) !important; }
    .quiz-wrap { background: rgba(220,238,255,0.98) !important; }
    .stat-card, .chart-card { background: rgba(220,238,255,0.98) !important; }
    .profiler-box { background: rgba(220,238,255,0.98) !important; }
  ` : '';

  return (
    <div
      className={`app-shell${theme === 'light' ? ' theme-light' : ''}`}
      style={currentTheme}
    >
      <style>{GLOBAL_CSS}</style>
      <style>{`:root { ${themeVars} }`}</style>
      {lightThemeCSS && <style>{lightThemeCSS}</style>}
      <div className="neural-bg" />
      <div className="grain" />

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      <div
        className={`sidebar-overlay${mobileSidebarOpen ? ' visible' : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* ── TOAST ── */}
      {toast && <div className="toast">✓ {toast}</div>}

      {/* ── SETTINGS PANEL ── */}
      {showSettings && (
        <div className="settings-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowSettings(false); }}>
          <div className="settings-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div className="settings-title">Settings</div>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="settings-sub">Customize your Hanzala AI experience</div>

            {/* Profile */}
            <div className="settings-section">
              <div className="settings-section-label">Profile</div>
              <div className="settings-avatar">
                <User size={32} color="var(--pulse)" />
              </div>
              <input
                className="settings-name-input"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder="Your display name"
              />
            </div>

            {/* Theme */}
            <div className="settings-section">
              <div className="settings-section-label">Theme</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {Object.keys(THEMES).map(t => (
                  <div
                    key={t}
                    onClick={() => setTheme(t)}
                    style={{
                      padding: '10px 16px', borderRadius: '12px', cursor: 'pointer',
                      background: theme === t ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${theme === t ? 'var(--pulse)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', gap: '8px',
                      transition: 'all 0.2s', fontSize: '12px', color: 'var(--text)', fontWeight: 600,
                    }}
                  >
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: SWATCH_COLORS[t], boxShadow: `0 0 6px ${SWATCH_COLORS[t]}` }} />
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                    {theme === t && <Check size={11} color="var(--pulse)" />}
                  </div>
                ))}
              </div>
            </div>

            {/* About */}
            <div className="settings-section">
              <div className="settings-section-label">About</div>
              <div className="settings-row">
                <div>
                  <div className="settings-row-label">Hanzala AI</div>
                  <div className="settings-row-sub">Intelligent learning workspace</div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--pulse)', fontWeight: 700 }}>v2.0</div>
              </div>
            </div>

            <button
              className="action-btn primary"
              style={{ marginTop: 8 }}
              onClick={() => { showToast('Settings saved!'); setShowSettings(false); }}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar${!sidebarOpen && !isMobile ? ' collapsed' : ''}${isMobile && mobileSidebarOpen ? ' mobile-open' : ''}`}>
        <div className="brand">
          <div className="brand-orb">
            <BrainCircuit size={20} color="var(--pulse)" />
          </div>
          <h1 className="brand-name">Hanzala<span>AI</span></h1>
        </div>

        <button className="new-chat-btn" onClick={createNewChat}>
          <Plus size={16} color="var(--pulse)" />
          <span>New Session</span>
        </button>

        {/* Search */}
        <div className="sidebar-search">
          <Search size={13} color="var(--muted)" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search sessions..."
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: 0 }}>
              <X size={12} />
            </button>
          )}
        </div>

        <nav className="nav-scroll">
          <div className="nav-section-label">Analytics</div>
          <div className="nav-item" onClick={fetchProgress}>
            <div className="icon-wrap"><LayoutDashboard size={15} color="#60a5fa" /></div>
            Insights
          </div>

          <div className="nav-section-label">AI Agents</div>
          <div className="nav-item" onClick={startAssessment}>
            <div className="icon-wrap"><ClipboardCheck size={15} color="var(--pulse)" /></div>
            Assessment
          </div>
          <div className="nav-item" onClick={generatePath}>
            <div className="icon-wrap"><Map size={15} color="var(--bio)" /></div>
            Roadmap
          </div>
          <div className="nav-item" onClick={takeQuiz}>
            <div className="icon-wrap"><Zap size={15} color="var(--amber, #ffaa00)" /></div>
            Quiz
          </div>

          <div className="nav-section-label">
            History {filteredSessions.length > 0 && `(${filteredSessions.length})`}
          </div>
          {filteredSessions.length === 0 && searchQuery && (
            <div style={{ fontSize: '12px', color: 'var(--muted)', padding: '8px 10px' }}>No sessions found</div>
          )}
          {filteredSessions.map(s => {
            // NEW STATE TO TRACK WHICH MENU IS OPEN
            const isMenuOpen = activeMenuSessionId === s.id;

            const handleRename = async (id) => {
              const newTitle = prompt("Enter new title:", s.title);
              if (!newTitle) return;
              await fetch(`/api/sessions/${id}/rename`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
              });
              fetchSessions();
            };

            const togglePin = async (id) => {
              await fetch(`/api/sessions/${id}/pin`, { method: 'PUT' });
              fetchSessions();
            };

            return (
              <div
                key={s.id}
                className={`session-item${currentSessionId === s.id ? ' active' : ''}`}
                style={{ ...(s.is_pinned ? { borderLeft: '3px solid var(--amber)' } : {}), position: 'relative' }}
                onClick={() => { setCurrentSessionId(s.id); setActiveMenuSessionId(null); }}
              >
                <div className="session-title" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {s.is_pinned ? <Pin size={12} color="var(--amber)" /> : <History size={13} />}
                  <span style={{ fontWeight: '800', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                </div>

                {/* Three-dot menu button */}
                <button
                  onClick={e => { e.stopPropagation(); setActiveMenuSessionId(isMenuOpen ? null : s.id); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--muted)', padding: '2px 4px', borderRadius: '6px',
                    display: 'flex', alignItems: 'center', flexShrink: 0,
                    opacity: isMenuOpen ? 1 : 0,
                    transition: 'opacity 0.2s',
                  }}
                  className="session-menu-btn"
                >
                  <MoreVertical size={14} />
                </button>

                {/* Dropdown menu */}
                {isMenuOpen && (
                  <React.Fragment key={`menu-${s.id}`}>
                    <div onClick={e => { e.stopPropagation(); setActiveMenuSessionId(null); }} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
                    <div
                      onClick={e => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: '10px',
                        right: '10px',
                        background: 'linear-gradient(135deg, #041424, #020d18)',
                        border: '1px solid var(--border-bright)',
                        borderRadius: '14px',
                        padding: '6px',
                        zIndex: 99,
                        boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                      }}
                    >
                      {/* Rename */}
                      <button onClick={() => { handleRename(s.id); setActiveMenuSessionId(null); }} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: '9px 12px', borderRadius: '9px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <Edit3 size={13} color="var(--pulse)" /> Rename
                      </button>

                      {/* Pin / Unpin */}
                      <button onClick={() => { togglePin(s.id); setActiveMenuSessionId(null); }} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: '9px 12px', borderRadius: '9px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <Pin size={13} color="var(--amber)" /> {s.is_pinned ? 'Unpin' : 'Pin'}
                      </button>

                      {/* Share / Copy link */}
                      <button onClick={() => { navigator.clipboard.writeText(`Session: ${s.title}`); setActiveMenuSessionId(null); }} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: '9px 12px', borderRadius: '9px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <Share size={13} color="var(--bio)" /> Copy Title
                      </button>

                      {/* Divider */}
                      <div style={{ height: '1px', background: 'var(--border)', margin: '4px 8px' }} />

                      {/* Delete */}
                      <button onClick={async () => { await fetch(`/api/sessions/${s.id}`, { method: 'DELETE' }); if (currentSessionId === s.id) { setCurrentSessionId(null); setChat([]); } fetchSessions(); setActiveMenuSessionId(null); }} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b', padding: '9px 12px', borderRadius: '9px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,107,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <Trash2 size={13} color="#ff6b6b" /> Delete
                      </button>
                    </div>
                    </React.Fragment>
              )}
            </div>
          );
        })}
        </nav>

        {/* Theme + Light Toggle + Settings */}
        <div className="theme-bar">
          <span className="theme-label">THEME</span>
          {Object.keys(THEMES).map(t => (
            <div
              key={t}
              className={`theme-swatch${theme === t ? ' active' : ''}`}
              title={t.charAt(0).toUpperCase() + t.slice(1)}
              style={{
                background: SWATCH_COLORS[t],
                boxShadow: theme === t ? `0 0 8px ${SWATCH_COLORS[t]}` : 'none',
              }}
              onClick={() => setTheme(t)}
            />
          ))}
          <div
            className={`lightmode-toggle${theme === 'light' ? ' on' : ''}`}
            onClick={() => setTheme(theme === 'light' ? 'ocean' : 'light')}
            title="Toggle light mode"
          >
            <div className="lightmode-toggle-knob" />
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="viewport">
        <div className="top-bar">
          <div className="top-bar-left">
            {/* Sidebar toggle */}
            <button
              className="sidebar-toggle"
              onClick={() => isMobile ? setMobileSidebarOpen(v => !v) : setSidebarOpen(v => !v)}
              title="Toggle sidebar"
            >
              {(isMobile ? mobileSidebarOpen : sidebarOpen)
                ? <PanelLeftClose size={16} />
                : <PanelLeft size={16} />
              }
            </button>
            <span className="top-bar-title">
              {currentSessionId
                ? sessions.find(s => s.id === currentSessionId)?.title || 'Active Session'
                : 'No Session Selected'}
            </span>
          </div>
          <div className="top-bar-right">
            <div className="status-dot">NEURAL CORE ONLINE</div>

            {/* Model Selector */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowModelMenu(p => !p)}
                style={{
                  background: showModelMenu ? 'rgba(0,229,255,0.12)' : 'rgba(0,229,255,0.06)',
                  border: '1px solid var(--border-bright)',
                  borderRadius: '12px',
                  padding: '7px 14px',
                  color: 'var(--text)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{
                  background: selectedModel.color,
                  color: '#fff',
                  fontSize: '9px',
                  fontWeight: '800',
                  padding: '3px 7px',
                  borderRadius: '6px',
                  letterSpacing: '0.5px',
                }}>{selectedModel.badge}</span>
                <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedModel.name}
                </span>
                <span style={{ color: 'var(--muted)', fontSize: '10px', transition: 'transform 0.2s', transform: showModelMenu ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
              </button>

              {showModelMenu && (
                <>
                  <div onClick={() => setShowModelMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: 'linear-gradient(135deg, #041424 0%, #020d18 100%)',
                    border: '1px solid var(--border-bright)',
                    borderRadius: '18px',
                    padding: '12px',
                    zIndex: 999,
                    width: '280px',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
                  }}>
                    <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: '800', letterSpacing: '2px', padding: '4px 10px 12px', borderBottom: '1px solid var(--border)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'var(--pulse)' }}>◈</span> SELECT AI MODEL
                    </div>
                    {AI_MODELS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setSelectedModel(m); setShowModelMenu(false); }}
                        style={{
                          width: '100%',
                          background: selectedModel.id === m.id ? `linear-gradient(135deg, ${m.color}18, ${m.color}08)` : 'transparent',
                          border: selectedModel.id === m.id ? `1px solid ${m.color}55` : '1px solid transparent',
                          borderRadius: '12px',
                          padding: '11px 14px',
                          color: 'var(--text)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '4px',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ background: m.color, color: '#fff', fontSize: '9px', fontWeight: '800', padding: '3px 7px', borderRadius: '6px', minWidth: '52px', textAlign: 'center', letterSpacing: '0.5px', flexShrink: 0 }}>{m.badge}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: selectedModel.id === m.id ? '#fff' : 'var(--text)' }}>{m.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{m.desc}</div>
                        </div>
                        {selectedModel.id === m.id && (
                          <span style={{ color: m.color, fontSize: '16px', flexShrink: 0, filter: `drop-shadow(0 0 4px ${m.color})` }}>✓</span>
                        )}
                      </button>
                    ))}
                    <div style={{ marginTop: '8px', padding: '8px 10px', background: 'rgba(57,255,122,0.06)', border: '1px solid rgba(57,255,122,0.15)', borderRadius: '10px', fontSize: '11px', color: 'var(--bio)', textAlign: 'center', fontWeight: '600' }}>
                      ✦ All models are free via OpenRouter
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={exportChatAsPDF}
              disabled={chat.length === 0}
              title="Export chat as PDF"
              style={{
                background: chat.length === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,229,255,0.1)',
                border: '1px solid var(--border-bright)',
                borderRadius: '10px',
                padding: '7px 14px',
                color: chat.length === 0 ? 'var(--muted)' : 'var(--pulse)',
                fontSize: '12px',
                fontWeight: '700',
                cursor: chat.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                letterSpacing: '0.5px',
              }}
            >
              <Download size={13} /> Export PDF
            </button>
            <button className="profile-btn" onClick={() => setShowSettings(true)} title="Settings & Profile">
              <User size={16} color="var(--pulse)" />
            </button>
          </div>
        </div>

        <div className="chat-stream">

          {/* HERO */}
          {chat.length === 0 && !activeQuiz && !showDashboard && !interviewMode && (
            <div className="hero">
              <div className="hero-badge">
                <Sparkles size={10} /> HANZALA AI · INTELLIGENT WORKSPACE
              </div>
              <h2 className="hero-title">
                Learn Smarter.<br /><em>Think Deeper.</em>
              </h2>
              <p className="hero-sub">
                An AI-powered learning system that adapts to your pace, gaps, and goals.
              </p>
              <div className="hero-cards">
                <div className="hero-card card-assess" onClick={startAssessment}>
                  <div className="card-icon cyan"><ClipboardCheck size={18} color="var(--pulse)" /></div>
                  <div className="card-title">Skill Assessment</div>
                  <div className="card-desc">Map your knowledge gaps with precision diagnostics.</div>
                </div>
                <div className="hero-card card-road" onClick={generatePath}>
                  <div className="card-icon green"><Map size={18} color="var(--bio)" /></div>
                  <div className="card-title">Build Roadmap</div>
                  <div className="card-desc">Get a custom learning track built around you.</div>
                </div>
                <div className="hero-card card-quiz" onClick={takeQuiz}>
                  <div className="card-icon amber"><Zap size={18} color="#ffaa00" /></div>
                  <div className="card-title">Live Quiz</div>
                  <div className="card-desc">Validate mastery through adaptive challenges.</div>
                </div>
              </div>
            </div>
          )}

          {/* DASHBOARD */}
          {showDashboard && (
            <div className="dash-grid">
              <div className="stat-card">
                <span className="stat-label">Avg Accuracy</span>
                <div className="stat-value">{stats.average_score}%</div>
              </div>
              <div className="stat-card">
                <span className="stat-label">Mastery Index</span>
                <div className="stat-value" style={{ color: 'var(--bio)' }}>
                  {stats.completed_modules}/{stats.total_modules}
                </div>
              </div>
              <div className="chart-card">
                <div className="chart-label">Learning Velocity</div>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--pulse)" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="var(--pulse)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="attempt" hide />
                      <YAxis domain={[0, 100]} hide />
                      <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border-bright)', borderRadius: 10, fontFamily: 'Syne' }} />
                      <Area type="monotone" dataKey="score" stroke="var(--pulse)" fill="url(#cg)" strokeWidth={2} dot={{ fill: 'var(--pulse)', r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <button className="dash-close-btn" onClick={() => setShowDashboard(false)}>
                ← Back to Session
              </button>
            </div>
          )}

          {/* INTERVIEW / SKILL PROFILER */}
          {interviewMode && (
            <div className="profiler-box">
              <div className="profiler-title">Skill Profiler</div>
              <div className="profiler-sub">Tell us where you are — we'll map where to go.</div>
              <div className="form-group">
                <label className="form-label">Target Domain</label>
                <input
                  type="text" className="form-input"
                  placeholder="e.g. React, Machine Learning, SQL..."
                  onChange={e => setInterviewData({ ...interviewData, topic: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Theoretical Grip — {interviewData.grip}/5</label>
                <input type="range" min="1" max="5" value={interviewData.grip} className="slider-track"
                  onChange={e => setInterviewData({ ...interviewData, grip: parseInt(e.target.value) })} />
                <div className="slider-labels">
                  <span className="slider-label-text">Beginner</span>
                  <span className="slider-label-text">Expert</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Coding Efficiency — {interviewData.efficiency}/5</label>
                <input type="range" min="1" max="5" value={interviewData.efficiency} className="slider-track"
                  onChange={e => setInterviewData({ ...interviewData, efficiency: parseInt(e.target.value) })} />
                <div className="slider-labels">
                  <span className="slider-label-text">Novice</span>
                  <span className="slider-label-text">Advanced</span>
                </div>
              </div>
              <button className="action-btn primary" onClick={handleFinishInterview}>
                Generate My Roadmap →
              </button>
            </div>
          )}

          {/* MESSAGES */}
{!showDashboard && !interviewMode && chat.map((m, i) => (
  <div key={i} className={`msg-row ${m.sender === 'User' ? 'user' : 'ai'}`}>
    <div className={`bubble ${m.sender === 'User' ? 'user' : 'ai'}`}>
      <div className="bubble-meta">
        <div className="bubble-meta-left">
          <span className="sender-tag">{m.sender === 'User' ? (userName || 'You') : 'Hanzala AI'}</span>
        </div>
        <div className="bubble-actions">
          <CopyButton text={m.message} small={false} />
          {m.sender !== 'User' && (
            <button
              className="voice-btn"
              onClick={() => { if (window.speechSynthesis.speaking) handleStop(); else handleSpeak(m.message); }}
            >
              <span className="play-icon"><Play size={12} color="var(--pulse)" /></span>
              <span className="pause-icon"><Pause size={12} color="var(--coral)" /></span>
            </button>
          )}
        </div>
      </div>

      {/* 📎 ATTACHMENT BOX: Shows up inside the bubble if a file was sent */}
      {m.message && m.message.startsWith('[File:') && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-bright)',
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div style={{
            width: '32px', height: '32px', background: '#ff4d4d', 
            borderRadius: '8px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', boxShadow: '0 0 10px rgba(255, 77, 77, 0.3)'
          }}>
            <FileText size={18} color="white" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>
              {m.message.split(']')[0].replace('[File: ', '')}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--muted)' }}>DOCUMENT</span>
          </div>
        </div>
      )}

      {/* RENDER THE TEXT CONTENT */}
      {/* RENDER THE TEXT CONTENT */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <div style={{ marginBottom: '10px', lineHeight: '1.8' }}>{children}</div>,
          h1: ({ children }) => <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: '20px 0 10px', fontFamily: 'Instrument Serif, serif', borderBottom: '1px solid var(--border-bright)', paddingBottom: '8px' }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: '18px 0 8px', fontFamily: 'Instrument Serif, serif' }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--pulse)', margin: '14px 0 6px', letterSpacing: '0.3px' }}>{children}</h3>,
          ul: ({ children }) => <ul style={{ paddingLeft: '20px', margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ paddingLeft: '20px', margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>{children}</ol>,
          li: ({ children }) => <li style={{ color: 'var(--text)', lineHeight: '1.7', fontSize: '14px' }}>{children}</li>,
          strong: ({ children }) => <strong style={{ color: '#ffffff', fontWeight: '700' }}>{children}</strong>,
          em: ({ children }) => <em style={{ color: 'var(--bio)', fontStyle: 'italic' }}>{children}</em>,
          blockquote: ({ children }) => (
            <blockquote style={{
              borderLeft: '3px solid var(--pulse)', margin: '14px 0',
              paddingLeft: '16px', color: 'var(--muted)', fontStyle: 'italic',
              background: 'rgba(0,229,255,0.04)', borderRadius: '0 10px 10px 0', padding: '12px 16px',
            }}>{children}</blockquote>
          ),
          hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--border-bright)', margin: '16px 0' }} />,
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', margin: '16px 0', borderRadius: '12px', border: '1px solid var(--border-bright)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead style={{ background: 'rgba(0,229,255,0.08)' }}>{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr style={{ borderBottom: '1px solid var(--border)' }}>{children}</tr>,
          th: ({ children }) => <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--pulse)', fontWeight: '700', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{children}</th>,
          td: ({ children }) => <td style={{ padding: '10px 16px', color: 'var(--text)', lineHeight: '1.6', borderRight: '1px solid var(--border)', verticalAlign: 'top' }}>{children}</td>,
          a: ({ node, children, href, ...props }) => {
            const isYouTube = href && (href.includes('youtube.com') || href.includes('youtu.be'));
            if (isYouTube) {
              return (
                <div style={{
                  marginTop: '15px', padding: '16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  borderLeft: '4px solid #fbbf24', borderRadius: '12px',
                  border: '1px solid var(--border-bright)',
                }}>
                  <div style={{ color: '#fbbf24', fontSize: '10px', fontWeight: '800', marginBottom: '5px' }}>
                    YOUTUBE RECOMMENDED
                  </div>
                  <a href={href} target="_blank" rel="noreferrer" style={{ color: '#7dd3fc', textDecoration: 'none' }}>
                    {children}
                  </a>
                </div>
              );
            }
            return <a href={href} {...props} style={{ color: 'var(--pulse)', textDecoration: 'underline' }}>{children}</a>;
          },
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            if (!inline && match) {
              const codeStr = String(children).replace(/\n$/, '');
              return (
                <div className="code-block-wrapper">
                  <CodeCopyBtn code={codeStr} />
                  <SyntaxHighlighter
                    style={atomDark} language={match[1]} PreTag="div"
                    customStyle={{ borderRadius: '12px', margin: '14px 0', fontSize: '13px' }}
                    {...props}
                  >
                    {codeStr}
                  </SyntaxHighlighter>
                </div>
              );
            }
            return <code className="inline-code" {...props}>{children}</code>;
          }
        }}
      >
        {m.message.includes(']') ? m.message.split(']').slice(1).join(']').trim() : m.message}
      </ReactMarkdown>
    </div>
  </div>
))}

          {/* LOADING */}
          {loading && (
            <div className="msg-row ai">
              <div className="bubble ai">
                <div className="bubble-meta">
                  <span className="sender-tag">Hanzala AI</span>
                </div>
                <div className="loading-row">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          {/* QUIZ */}
          {activeQuiz && (
            <div className="quiz-wrap">
              <div className="quiz-header"><Zap size={20} /> Performance Check</div>
              {activeQuiz.map((q, idx) => (
                <div key={idx} className="quiz-q-box">
                  <div className="quiz-q-text">{q.question}</div>
                  <div className="options-col">
                    {q.options.map(opt => {
                      const letter = opt.charAt(0).toUpperCase();
                      return (
                        <button
                          key={letter}
                          className={`quiz-opt${userAnswers[idx] === letter ? ' selected' : ''}`}
                          onClick={() => setUserAnswers({ ...userAnswers, [idx]: letter })}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <button className="action-btn quiz-submit" onClick={submitQuiz}>Evaluate Results →</button>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ── INPUT ── */}
        {/* ── INPUT ── */}
        <footer className="input-area">
          {/* AI Prompt Calibration Pop-up (Positioned above the shell) */}
          {promptSuggestions.length > 0 && showSuggestions && (
            <div style={{
              position: 'fixed',
              bottom: '120px',
              left: '50%', transform: 'translateX(-50%)',
              width: '100%', maxWidth: '600px',
              display: 'flex', flexDirection: 'column', gap: '8px',
              padding: '0 20px', zIndex: 9999,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <div style={{ fontSize: '10px', color: 'var(--pulse)', fontWeight: '800', letterSpacing: '1.5px', background: 'rgba(1, 8, 16, 0.9)', padding: '4px 10px', borderRadius: '4px' }}>
                  <Sparkles size={10} style={{ marginRight: '5px' }} /> IMPROVED PROMPT
                </div>
                <button
                  onClick={() => setShowSuggestions(false)}
                  style={{ background: 'rgba(255, 107, 107, 0.1)', border: '1px solid rgba(255, 107, 107, 0.2)', borderRadius: '6px', cursor: 'pointer', color: 'var(--coral)', display: 'flex', alignItems: 'center', padding: '4px' }}
                >
                  <X size={14} />
                </button>
              </div>
              {promptSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setUserInput(s); setPromptSuggestions([]); }}
                  style={{
                    background: 'rgba(4, 22, 40, 0.95)', border: '1px solid var(--border-bright)',
                    borderRadius: '12px', padding: '12px 16px', color: 'var(--text)',
                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                    backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}
                >
                  <div style={{ fontSize: '12.5px', lineHeight: '1.4' }}>{s}</div>
                </button>
              ))}
            </div>
          )}

          <div className="input-shell" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '12px' }}>
            
            {/* 📎 GEMINI-STYLE STAGED PREVIEW (Inside the shell) */}
            {stagedFile && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-bright)',
                borderRadius: '12px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px',
                width: 'fit-content',
                position: 'relative'
              }}>
                <div style={{
                  width: '28px', height: '28px', background: '#ff4d4d', 
                  borderRadius: '6px', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center'
                }}>
                  <FileText size={16} color="white" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', marginRight: '20px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'white' }}>
                    {stagedFile.name}
                  </span>
                  <span style={{ fontSize: '9px', color: 'var(--muted)' }}>PDF</span>
                </div>
                <button 
                  onClick={() => setStagedFile(null)}
                  style={{ 
                    position: 'absolute', top: '-5px', right: '-5px',
                    background: 'var(--abyss)', border: '1px solid var(--border-bright)',
                    borderRadius: '50%', color: 'white', cursor: 'pointer', padding: '2px'
                  }}
                >
                  <X size={10} />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '10px' }}>
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) setStagedFile(file); 
                }}
              />

              <button className="input-tool-btn" onClick={() => fileInputRef.current?.click()}>
                <Plus size={18} />
              </button>

              <button
                className={`input-tool-btn${isRecording ? ' active' : ''}`}
                onClick={toggleVoiceInput}
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <input
                className="chat-input"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    !currentSessionId ? createNewWithPrompt() : sendToAI();
                  }
                }}
                placeholder={isRecording ? 'Listening…' : 'Ask anything...'}
                style={{ height: '30px' }}
              />

              <button 
                className="send-btn" 
                onClick={!currentSessionId ? createNewWithPrompt : sendToAI} 
                disabled={loading}
              >
                <SendHorizontal size={18} color="#010810" />
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

/* ─── CODE COPY BUTTON (for code blocks) ─── */
const CodeCopyBtn = ({ code }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className={`code-copy-btn${copied ? ' copied' : ''}`}
      onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};

export default App;