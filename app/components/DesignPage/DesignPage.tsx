"use client";
import React, { useState, useRef } from "react";
import { Rnd } from "react-rnd";
import Image from "next/image";
import Sidebar from "../Sidebar/Sidebar";
import BagBlueprint from "../BagBlueprint/BagBlueprint";
import styles from "./DesignPage.module.css";
import resizeIcon from "../../public/resize.png";

interface DesignPageProps {
  handleNavigation: (page: string) => void;
}

// Define the BagDimensions interface
interface BagDimensions {
  length: number;
  width: number;
  height: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DesignPage: React.FC<DesignPageProps> = ({ handleNavigation }) => {
  const [logo, setLogo] = useState<string | null>(null);
  const [draggable, setDraggable] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rndRef = useRef<Rnd>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Add state for bag dimensions
  const [dimensions, setDimensions] = useState<BagDimensions>({
    length: 310,
    width: 165,
    height: 428
  });
  
  // Add state to track if dimensions are being edited
  const [isEditingDimensions, setIsEditingDimensions] = useState(false);
  const handleLogoUpload = (files: FileList) => {
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === "string") {
          setLogo(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClear = () => {
    setLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleDragMode = () => {
    setDraggable(!draggable);
    setIsActive(!isActive);
  };

  const disableDrag = () => {
    setDraggable(false);
    setIsActive(false);
  };
  
  // Start editing dimensions
  const startEditingDimensions = () => {
    // Initialize current edit values with the existing dimensions
    setIsEditingDimensions(true);
  };
    
  // Confirm dimension changes
  const handleDimensionChange = (newDimensions: BagDimensions) => {
    setDimensions(newDimensions);
    setIsEditingDimensions(false); // Mark editing as complete
  };
  return (
    <div className={styles.pageContainer}>
      <Sidebar
        handleLogoUpload={handleLogoUpload}
        handleClear={handleClear}
        fileInputRef={fileInputRef}
        dimensions={dimensions}
        handleDimensionChange={handleDimensionChange}
        startEditingDimensions={startEditingDimensions}
      />
      
      <div className={styles.bagContainer}>
        <BagBlueprint 
          dimensions={dimensions} 
          isEditing={isEditingDimensions}
        />

        {logo && (
          <Rnd
            default={{ x: 50, y: 50, width: 150, height: 150 }}
            bounds="parent"
            disableDragging={!draggable}
            enableResizing={{ bottomRight: true }}
            onDragStop={disableDrag}
            onResizeStop={disableDrag}
            ref={rndRef}
          >
            <div
              style={{ width: "100%", height: "100%", position: "relative" }}
              onClick={toggleDragMode}
              className={`${styles.logoOverlay} ${isActive ? styles.active : ""}`}
            >
              <Image
                src={logo}
                alt="Uploaded Logo"
                ref={imageRef}
                style={{ width: "100%", height: "100%" }}
              />
              {isActive && (
                <div className={styles.customResizeHandle}>
                  <Image
                    src={resizeIcon}
                    alt="Resize Handle"
                    layout="fill"
                    objectFit="contain"
                  />
                </div>
              )}
            </div>
          </Rnd>
        )}
      </div>
    </div>
  );
};

export default DesignPage;