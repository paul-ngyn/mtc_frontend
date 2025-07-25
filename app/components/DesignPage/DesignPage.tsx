"use client";
import React, { useState, useRef, useEffect } from "react";
import { Rnd } from "react-rnd";
import Sidebar from "../Sidebar/Sidebar";
import BagBlueprint from "../BagBlueprint/BagBlueprint";
import LogoItem, { Logo } from "../LogoItem/LogoItem";
import LoginRequiredPopup from "../LoginRequiredPopup/LoginRequiredPopup";
import AuthForm from "../AuthForm/AuthForm";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./DesignPage.module.css";
import { BagDimensions } from "../../util/BagDimensions";
import { generatePDF } from "../../util/pdfGenerator";

interface DesignPageProps {
  handleNavigation: (page: string) => void;
}

interface TextStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  fontWeight: string;
  rotation?: number;
}

const DesignPage: React.FC<DesignPageProps> = () => {
  // Get auth context
  const { user } = useAuth();
  
  // State declarations
  const [logos, setLogos] = useState<Logo[]>([]);
  const [activeLogoId, setActiveLogoId] = useState<string | null>(null);
  const [draggable, setDraggable] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [dimensions, setDimensions] = useState<BagDimensions>({
    length: 310,
    width: 155,
    height: 428
  });
  const [isEditingDimensions, setIsEditingDimensions] = useState(false);
  
  // Auth popup states
  const [showLoginRequiredPopup, setShowLoginRequiredPopup] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [pendingAction, setPendingAction] = useState<'download' | 'quote' | null>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoRefs = useRef<Map<string, React.RefObject<Rnd>>>(new Map());
  const bagContainerRef = useRef<HTMLDivElement>(null);

  // Handle authentication success - execute pending action
  useEffect(() => {
    if (user && pendingAction) {
      if (pendingAction === 'download') {
        handleGeneratePDF();
      }
      setPendingAction(null);
    }
  }, [user, pendingAction]);

  // Generate PDF function with auth check
  const handleGeneratePDF = async () => {
    if (!user) {
      setPendingAction('download');
      setShowLoginRequiredPopup(true);
      return false;
    }
    
     try {
    const result = await generatePDF(dimensions, logos, bagContainerRef);
    return result || true; // Ensure we always return a boolean
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

  // Handle login required popup
  const handleLoginRequiredClose = () => {
    setShowLoginRequiredPopup(false);
    setPendingAction(null);
  };

  const handleLoginRequiredLogin = () => {
    setShowLoginRequiredPopup(false);
    setShowAuthForm(true);
    // Don't clear pendingAction - we want to execute it after login
  };

  const handleAuthFormClose = () => {
    setShowAuthForm(false);
    // Don't clear pendingAction here - let the useEffect handle it
  }
  // Handle logo upload
  const handleLogoUpload = (files: FileList) => {
    if (!files.length) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        const newLogo: Logo = {
          id: `logo-${Date.now()}`,
          type: 'image',
          src: e.target.result,
          position: { x: 50, y: 50 },
          size: { width: 150, height: 150 },
          rotation: 0
        };
        
        logoRefs.current.set(newLogo.id, React.createRef<Rnd>());
        setLogos(prev => [...prev, newLogo]);
        setActiveLogoId(newLogo.id);
        setDraggable(true);
        setIsActive(true);
      }
    }; 
    
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Calculate optimal text box dimensions
  const calculateOptimalTextSize = (text: string, fontSize: number): { width: number, height: number } => {
    const lines = text.split('\n');
    const lineCount = lines.length;
    const longestLine = Math.max(...lines.map(line => line.length || 1));
    
    const charWidth = fontSize * 0.6;
    const lineHeight = fontSize * 1.4;
    
    const widthPadding = fontSize * 1.2;
    const heightPadding = fontSize * 0.8;
    
    const optimalWidth = Math.max(100, (longestLine * charWidth) + widthPadding);
    const optimalHeight = Math.max(40, (lineCount * lineHeight) + heightPadding);
    
    return { width: optimalWidth, height: optimalHeight };
  };

  // Handle adding text
  const handleAddText = (text?: string, style?: TextStyle) => {
    const textContent = text || "Your text here";
    const textStyle = style || {
      fontFamily: 'Arial',
      fontSize: 24,
      color: '#000000',
      fontWeight: 'normal',
      rotation: 0
    };
    
    const { width, height } = calculateOptimalTextSize(textContent, textStyle.fontSize);
    
    const newTextLogo: Logo = {
      id: `text-${Date.now()}`,
      type: 'text',
      text: textContent,
      textStyle: textStyle,
      position: { x: 50, y: 50 },
      size: { width, height },
      rotation: textStyle.rotation || 0
    };
    
    logoRefs.current.set(newTextLogo.id, React.createRef<Rnd>());
    setLogos(prev => [...prev, newTextLogo]);
    setActiveLogoId(newTextLogo.id);
    setDraggable(true);
    setIsActive(true);
  };
  
  // Update text content and styling
  const updateTextContent = (id: string, text: string, style: TextStyle) => {
    const { width, height } = calculateOptimalTextSize(text, style.fontSize);
    
    setLogos(prev => prev.map(logo => {
      if (logo.id === id) {
        return { 
          ...logo, 
          text, 
          textStyle: style, 
          size: { width, height },
          rotation: style.rotation !== undefined ? style.rotation : (logo.rotation || 0)
        };
      }
      return logo;
    }));
  };
  
  // Logo operations (delete, duplicate, move)
  const handleLogoDelete = (logoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setLogos(prev => prev.filter(logo => logo.id !== logoId));
    logoRefs.current.delete(logoId);
    
    if (activeLogoId === logoId) {
      setActiveLogoId(null);
      setDraggable(false);
      setIsActive(false);
    }
  };

  const handleDuplicateLogo = (logoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    const logoToDuplicate = logos.find(logo => logo.id === logoId);
    if (!logoToDuplicate) return;
    
    const newLogo: Logo = {
      id: `${logoToDuplicate.type}-${Date.now()}`,
      type: logoToDuplicate.type,
      src: logoToDuplicate.src,
      text: logoToDuplicate.text,
      textStyle: logoToDuplicate.textStyle ? {...logoToDuplicate.textStyle} : undefined,
      position: { 
        x: logoToDuplicate.position.x + 20, 
        y: logoToDuplicate.position.y + 20 
      },
      size: { ...logoToDuplicate.size },
      rotation: logoToDuplicate.rotation || (logoToDuplicate.textStyle?.rotation ?? 0)
    };
    
    logoRefs.current.set(newLogo.id, React.createRef<Rnd>());
    setLogos(prev => [...prev, newLogo]);
    setActiveLogoId(newLogo.id);
    setDraggable(true);
    setIsActive(true);
  };

  const handleLogoMove = (
    logoId: string, 
    position: {x: number, y: number}, 
    size?: {width: number, height: number},
    textStyle?: TextStyle
  ) => {
    setLogos(prev => prev.map(logo => {
      if (logo.id === logoId) {
        const updatedLogo = {
          ...logo,
          position,
          size: size || logo.size,
          rotation: logo.rotation ?? (logo.textStyle?.rotation ?? 0)
        };
        
        if (textStyle) {
          const preservedRotation = textStyle.rotation !== undefined 
            ? textStyle.rotation 
            : (logo.rotation ?? (logo.textStyle?.rotation ?? 0));
            
          updatedLogo.textStyle = {
            ...textStyle,
            rotation: preservedRotation
          };
          updatedLogo.rotation = preservedRotation;
        }
        
        return updatedLogo;
      }
      return logo;
    }));
  };

  const onLogoRotate = (logoId: string, rotation: number) => {
    setLogos(prevLogos => 
      prevLogos.map(logo => {
        if (logo.id === logoId) {
          if (logo.type === 'text' && logo.textStyle) {
            return {
              ...logo,
              rotation,
              textStyle: {
                ...logo.textStyle,
                rotation
              }
            };
          }
          return { ...logo, rotation };
        }
        return logo;
      })
    );
  };
  
  // UI interaction handlers
  const toggleDragMode = (logoId: string) => {
    setActiveLogoId(logoId);
    setIsActive(true);
    setDraggable(true);
  };
  
  const handleBagClick = (e: React.MouseEvent) => {
    if (e.currentTarget === e.target) {
      setActiveLogoId(null);
      setDraggable(false);
      setIsActive(false);
    }
  };
  
  const startEditingDimensions = () => setIsEditingDimensions(true);
  const handleDimensionChange = (newDimensions: BagDimensions) => {
    setDimensions(newDimensions);
    setIsEditingDimensions(false);
  };

  const handleLogoDeselect = () => {
    setActiveLogoId(null);
    setDraggable(false);
    setIsActive(false);
  };
  
  return (
    <div className={styles.pageContainer}>
      <Sidebar
        handleLogoUpload={handleLogoUpload}
        handleAddText={handleAddText}
        fileInputRef={fileInputRef}
        dimensions={dimensions}
        handleDimensionChange={handleDimensionChange}
        startEditingDimensions={startEditingDimensions}
        downloadDesign={handleGeneratePDF}
        logoCount={logos.length}
        activeLogoId={activeLogoId}
        activeLogoText={logos.find(logo => logo.id === activeLogoId && logo.type === 'text')?.text || ''}
        activeLogoTextStyle={logos.find(logo => logo.id === activeLogoId && logo.type === 'text')?.textStyle}
        updateTextContent={updateTextContent}
        onLogoDeselect={handleLogoDeselect}
      />
      
      <div 
        className={styles.bagContainer} 
        ref={bagContainerRef}
        onClick={handleBagClick}
      >
        <BagBlueprint 
          dimensions={dimensions} 
          isEditing={isEditingDimensions}
          currentEditValues={isEditingDimensions ? dimensions : undefined}
        />

        {logos.map((logo) => (
          <LogoItem
            key={logo.id}
            logo={logo}
            isActive={logo.id === activeLogoId && isActive}
            isDraggable={draggable}
            rndRef={logoRefs.current.get(logo.id) || React.createRef()}
            onToggleDragMode={toggleDragMode}
            onLogoMove={handleLogoMove}
            onLogoDelete={handleLogoDelete}
            onDuplicateLogo={handleDuplicateLogo}
            calculateOptimalTextSize={calculateOptimalTextSize}
            onLogoRotate={onLogoRotate}
          />
        ))}
      </div>

      {/* Login Required Popup */}
      <LoginRequiredPopup
        isOpen={showLoginRequiredPopup}
        onClose={handleLoginRequiredClose}
        onLogin={handleLoginRequiredLogin}
        action={pendingAction || 'download'}
      />

      {/* Auth Form Modal */}
      {showAuthForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <AuthForm onClose={handleAuthFormClose} />
          </div>
          <div className={styles.modalBackdrop} onClick={handleAuthFormClose}></div>
        </div>
      )}
    </div>
  );
};

export default DesignPage;