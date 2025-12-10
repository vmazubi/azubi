
import React from 'react';
import { Heart, ShieldAlert, Info, Code2 } from 'lucide-react';

const AboutSection: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-10">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <Info size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">About AzubiHub</h1>
            <p className="text-slate-500">Version 1.0.0</p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
              <Code2 size={20} className="text-slate-400" />
              Developer
            </h3>
            <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              The web app was developed by <strong>Alokzai</strong>.
            </p>
          </div>

          <p className="text-lg text-slate-600 leading-relaxed mb-4">
            This tool is specifically crafted to help <strong>V-Markt Azubis</strong> track their activities and update their <em>Berichtshefte</em> efficiently. 
          </p>
          
          <p className="text-slate-600 mb-6">
            It brings flexibility to your daily routine, allowing you to manage tasks, learn efficiently, and handle documentation seamlessly.
          </p>

          <div className="flex items-center gap-3 p-4 bg-green-50 text-green-800 rounded-xl border border-green-100 shadow-sm">
            <Heart className="shrink-0 text-green-600 fill-green-600/20" size={24} />
            <span className="font-medium">This project is free to use, without any other intentions.</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border-l-4 border-amber-400">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <ShieldAlert size={24} className="text-amber-500" />
          Important Notes & Disclaimer
        </h2>
        
        <div className="space-y-4 text-slate-600">
          <div className="flex gap-3">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0 mt-2.5" />
            <p>
              <strong>No Misuse:</strong> This application is a support tool. Do not use the AI features to fabricate work or falsify your report book. The content generated should reflect your actual learning and tasks at the workplace.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0 mt-2.5" />
            <p>
              <strong>Data Privacy:</strong> Do not upload confidential company documents, internal secrets, or sensitive customer data (GDPR). The AI is helpful, but always maintain professional discretion.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0 mt-2.5" />
            <p>
              <strong>Verification:</strong> You are solely responsible for the content submitted to your trainers. Always verify AI-generated text for accuracy before adding it to your official documents.
            </p>
          </div>
        </div>
      </div>
      
      <div className="text-center text-slate-400 text-sm py-4">
        &copy; {new Date().getFullYear()} Developed by Alokzai. All rights reserved.
      </div>
    </div>
  );
};

export default AboutSection;
