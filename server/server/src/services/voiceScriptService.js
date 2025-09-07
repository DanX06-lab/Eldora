// Dynamic voice scripts
class VoiceScriptService {
  
    /**
     * Generate personalized voice script for medication reminder
     */
    generateScript(medication, language, patientName) {
      const scripts = {
        en: this.generateEnglishScript(medication, patientName),
        hi: this.generateHindiScript(medication, patientName),
        es: this.generateSpanishScript(medication, patientName),
        fr: this.generateFrenchScript(medication, patientName)
      };
      
      return scripts[language] || scripts.en;
    }
    
    /**
     * English voice script
     */
    generateEnglishScript(medication, patientName) {
      const timeOfDay = this.getTimeOfDay();
      
      return `Hello ${patientName}, ${timeOfDay}. This is your medication reminder service. 
              It's time to take your ${medication.name}, ${medication.dosage}. 
              ${medication.instructions ? medication.instructions + '.' : ''}
              Please take your medication now and confirm by pressing 1 on your phone.`;
    }
    
    /**
     * Hindi voice script
     */
    generateHindiScript(medication, patientName) {
      const timeOfDay = this.getTimeOfDay();
      
      return `नमस्ते ${patientName}, ${timeOfDay}. यह आपकी दवा याद दिलाने की सेवा है। 
              अब ${medication.name}, ${medication.dosage} लेने का समय है।
              कृपया अपनी दवा लें और फोन पर 1 दबाकर पुष्टि करें।`;
    }
    
    /**
     * Spanish voice script
     */
    generateSpanishScript(medication, patientName) {
      const timeOfDay = this.getTimeOfDay();
      
      return `Hola ${patientName}, ${timeOfDay}. Este es su servicio de recordatorio de medicamentos.
              Es hora de tomar su ${medication.name}, ${medication.dosage}.
              Por favor tome su medicamento ahora y confirme presionando 1 en su teléfono.`;
    }
    
    /**
     * French voice script
     */
    generateFrenchScript(medication, patientName) {
      const timeOfDay = this.getTimeOfDay();
      
      return `Bonjour ${patientName}, ${timeOfDay}. Ceci est votre service de rappel de médicaments.
              Il est temps de prendre votre ${medication.name}, ${medication.dosage}.
              Veuillez prendre votre médicament maintenant et confirmer en appuyant sur 1 sur votre téléphone.`;
    }
    
    /**
     * Get appropriate greeting based on time of day
     */
    getTimeOfDay() {
      const hour = new Date().getHours();
      
      if (hour < 12) return 'good morning';
      if (hour < 17) return 'good afternoon';
      return 'good evening';
    }
    
    /**
     * Generate confirmation response script
     */
    generateConfirmationScript(language, medicationName, confirmed) {
      const scripts = {
        en: confirmed 
          ? `Thank you for confirming that you've taken your ${medicationName}. Have a great day!`
          : `I understand you need more time. Please take your ${medicationName} as soon as possible. A family member will be notified.`,
        
        hi: confirmed
          ? `${medicationName} लेने की पुष्टि के लिए धन्यवाद। आपका दिन शुभ हो!`
          : `मैं समझता हूं कि आपको और समय चाहिए। कृपया जल्द से जल्द अपनी ${medicationName} लें। परिवार के सदस्य को सूचित किया जाएगा।`,
        
        es: confirmed
          ? `Gracias por confirmar que ha tomado su ${medicationName}. ¡Que tenga un buen día!`
          : `Entiendo que necesita más tiempo. Por favor tome su ${medicationName} tan pronto como sea posible. Se notificará a un familiar.`,
        
        fr: confirmed
          ? `Merci de confirmer que vous avez pris votre ${medicationName}. Passez une excellente journée!`
          : `Je comprends que vous avez besoin de plus de temps. Veuillez prendre votre ${medicationName} dès que possible. Un membre de la famille sera notifié.`
      };
      
      return scripts[language] || scripts.en;
    }
  }
  
  module.exports = new VoiceScriptService();
  