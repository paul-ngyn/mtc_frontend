"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Sidebar.module.css";
import downloadicon from "../../public/downloadicon.png";
import BlueprintExample from "../../public/BlueprintExample.png";
import { BagDimensions, mmToInches} from "../../util/BagDimensions";


// Extended props to support text customization
interface SidebarProps {
  handleLogoUpload: (files: FileList) => void;
  onUploadError?: (message: string) => void;
  handleAddText: (text?: string, style?: TextStyle) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  dimensions: BagDimensions;
  handleDimensionChange: (dimensions: BagDimensions) => void;
  startEditingDimensions?: () => void;
  downloadDesign: () => Promise<boolean> | void;
  logoCount?: number;
  activeLogoId?: string | null;
  activeLogoText?: string;
  activeLogoTextStyle?: TextStyle;
  updateTextContent?: (id: string, text: string, style: TextStyle) => void;
  onLogoDeselect?: () => void; // Add this new prop
}

interface TextStyle {
  fontFamily: string;                   
  fontSize: number;
  color: string;
  fontWeight: string;
  rotation?: number;
}

const Sidebar: React.FC<SidebarProps> = ({
  handleLogoUpload,
  handleAddText,
  fileInputRef,
  dimensions,
  handleDimensionChange,
  startEditingDimensions = () => {}, 
  downloadDesign,
  logoCount = 0,
  activeLogoId = null,
  activeLogoText = "",
  activeLogoTextStyle,
  updateTextContent,
  onLogoDeselect,
}) => {
  // Add state for showing/hiding the blueprint example modal
  const [showBlueprintExample, setShowBlueprintExample] = useState(false);
  
  // Add state for sidebar mode (default/text)
  const [sidebarMode, setSidebarMode] = useState<'default' | 'text'>('default');
  
  // State for text input and styling
  const [textInput, setTextInput] = useState('Your text here');
  const [textStyle, setTextStyle] = useState<TextStyle>({
    fontFamily: 'Arial',
    fontSize: 24,
    color: '#000000',
    fontWeight: 'normal',
    rotation: 0 // Add default rotation
  });
  
  // Update text editing mode when active text logo changes
  useEffect(() => {
    if (activeLogoId && activeLogoText && activeLogoTextStyle) {
      // We're editing an existing text logo
      setTextInput(activeLogoText);
      setTextStyle({
        fontFamily: activeLogoTextStyle.fontFamily,
        fontSize: activeLogoTextStyle.fontSize, 
        color: activeLogoTextStyle.color,
        fontWeight: activeLogoTextStyle.fontWeight,
        rotation: activeLogoTextStyle.rotation || 0 // Include rotation
      });
      setSidebarMode('text');
    } else if (sidebarMode === 'text' && !activeLogoId) {
      // If we were in text mode but no active logo, reset
      setTextInput('Your text here');
      setTextStyle({
        fontFamily: 'Arial',
        fontSize: 24, 
        color: '#000000',
        fontWeight: 'normal',
        rotation: 0 // Reset rotation
      });
    }
  }, [activeLogoId, activeLogoText, activeLogoTextStyle, sidebarMode]);

  // Define max dimensions in inches
  const MAX_DIMENSIONS = {
    length: 21.65, 
    width: 11.81,
    height: 22.14 
  };

  const MIN_DIMENSIONS = {
    length: 6,
    width: 2,
    height: 6
  };
  
  // Use the utility function for precise conversion from inches to mm
  const inchesToMm = (inches: number) => {
    // Exact conversion - use decimal precision for millimeters
    return +(inches * 25.4).toFixed(2);
  };
  
  // Store current input values as strings to preserve what user types exactly
  const [inputValues, setInputValues] = useState({
    length: "",
    width: "",
    height: ""
  });
  
  // Store the actual numeric values (in inches) for calculations
  const [tempDimensionsInches, setTempDimensionsInches] = useState<{
    length: number;
    width: number;
    height: number;
  }>({
    length: mmToInches(dimensions.length, 2),
    width: mmToInches(dimensions.width, 2),
    height: mmToInches(dimensions.height, 2)
  });
  
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  
  
  // Update both states when props change
  useEffect(() => {
    const lengthInches = mmToInches(dimensions.length, 2);
    const widthInches = mmToInches(dimensions.width, 2);
    const tabsideHeightInches = mmToInches(dimensions.height, 2);
    
    setTempDimensionsInches({
      length: lengthInches,
      width: widthInches,
      height: tabsideHeightInches
    });
    
    // Format display values
    setInputValues({
      length: lengthInches.toString(),
      width: widthInches.toString(),
      height: tabsideHeightInches.toString()
    });
  }, [dimensions]);
  
  // Handler for dimension changes
  const onDimensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Always update the input value to exactly what user typed
    setInputValues({
      ...inputValues,
      [name]: value
    });
    
    // Only update numeric value if we have valid input
    if (value && !isNaN(parseFloat(value))) {
      const numValue = parseFloat(value);
      
      // Store the user's value without enforcing limits
      setTempDimensionsInches({
        ...tempDimensionsInches,
        [name]: numValue
      });
      
      // Notify parent that we're in editing mode
      startEditingDimensions();
    }
  };
  
  // Apply dimension changes when button is clicked
  const applyDimensions = () => {
    // First, enforce min/max limits before applying
    const clampedDimensions = {
      length: Math.min(Math.max(tempDimensionsInches.length, MIN_DIMENSIONS.length), MAX_DIMENSIONS.length),
      width: Math.min(Math.max(tempDimensionsInches.width, MIN_DIMENSIONS.width), MAX_DIMENSIONS.width),
      height: Math.min(Math.max(tempDimensionsInches.height, MIN_DIMENSIONS.height), MAX_DIMENSIONS.height)
    };
    
    // Update the input values to reflect any clamping
    setInputValues({
      length: clampedDimensions.length.toString(),
      width: clampedDimensions.width.toString(),
      height: clampedDimensions.height.toString()
    });
    
    // Update the temp dimensions with clamped values
    setTempDimensionsInches(clampedDimensions);
    
    // Convert inches back to mm when sending to parent component
    const newDimensions = {
      length: inchesToMm(clampedDimensions.length),
      width: inchesToMm(clampedDimensions.width),
      height: inchesToMm(clampedDimensions.height)
    };
    
    handleDimensionChange(newDimensions);
  };

  const onDimensionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applyDimensions();
    }
  };
  
  // Reset to the original dimensions
  const resetDimensions = () => {
    const lengthInches = mmToInches(dimensions.length, 2);
    const widthInches = mmToInches(dimensions.width, 2);
    const heightInches = mmToInches(dimensions.height, 2);
    
    setTempDimensionsInches({
      length: lengthInches,
      width: widthInches,
      height: heightInches
    });
    
    setInputValues({
      length: lengthInches.toString(),
      width: widthInches.toString(),
      height: heightInches.toString()
    });
  };

  // Drag and drop handlers remain unchanged
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      handleLogoUpload(e.dataTransfer.files);
      setFileName(e.dataTransfer.files[0].name);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) {
      handleLogoUpload(files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // === New Text Handling Functions ===
  const handleAddTextClick = () => {
    setSidebarMode('text');
    setTextInput('Your text here');
    setTextStyle({
      fontFamily: 'Arial',
      fontSize: 24,
      color: '#000000',
      fontWeight: 'normal'
    });
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
  };

  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rotationValue = parseInt(e.target.value, 10);
    setTextStyle(prev => ({ ...prev, rotation: rotationValue }));
  };
  
  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTextStyle(prev => ({ ...prev, fontFamily: e.target.value }));
  };
  
  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextStyle(prev => ({ ...prev, fontSize: parseInt(e.target.value, 10) }));
  };
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextStyle(prev => ({ ...prev, color: e.target.value }));
  };
  
  const handleFontWeightChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTextStyle(prev => ({ ...prev, fontWeight: e.target.value }));
  };
  
  const applyTextChanges = () => {
    if (activeLogoId && updateTextContent) {
      // Update existing text
      updateTextContent(activeLogoId, textInput, textStyle);
    } else {
      // Add new text
      handleAddText(textInput, textStyle);
    }
    setSidebarMode('default');
  };
  
  const cancelTextChanges = () => {
    setSidebarMode('default');
  };

  // Check if current values differ from original values
  const dimensionsChanged = () => {
    const originalInches = {
      length: mmToInches(dimensions.length, 2),
      width: mmToInches(dimensions.width, 2),
      height: mmToInches(dimensions.height, 2)
    };
    
    // Use small epsilon for floating point comparison
    const epsilon = 0.005; // Allow 0.005 inch difference (rounding errors)

    
    return (
      Math.abs(originalInches.length - tempDimensionsInches.length) > epsilon ||
      Math.abs(originalInches.width - tempDimensionsInches.width) > epsilon ||
      Math.abs(originalInches.height - tempDimensionsInches.height) > epsilon
    );
  };

  // Check if values are outside min/max limits
  const dimensionOutOfRange = (name: string, value: number): boolean => {
    if (name === 'length') {
      return value < MIN_DIMENSIONS.length || value > MAX_DIMENSIONS.length;
    } else if (name === 'width') {
      return value < MIN_DIMENSIONS.width || value > MAX_DIMENSIONS.width;
    } else if (name === 'height') {
      return value < MIN_DIMENSIONS.height || value > MAX_DIMENSIONS.height;
    }
    return false;
  };

  // Visual feedback if value is outside limits
  const getInputClass = (name: string): string => {
    const value = tempDimensionsInches[name as keyof typeof tempDimensionsInches];
    return dimensionOutOfRange(name, value) 
      ? `${styles.dimensionInput} ${styles.outOfRange}` 
      : styles.dimensionInput;
  };

  return (
    <div className={styles.sidebarContainer}>
      <h2 className={styles.sidebarTitle}>Design Your Bag</h2>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
      <button 
        className={`${styles.tabButton} ${sidebarMode === 'default' ? styles.activeTab : ''}`}
        onClick={() => {
          setSidebarMode('default');
          // Deselect active logo when switching to upload tab
          if (activeLogoId && onLogoDeselect) {
            onLogoDeselect();
          }
        }}
      >
        Upload
      </button>
      <button 
        className={`${styles.tabButton} ${sidebarMode === 'text' ? styles.activeTab : ''}`}
        onClick={handleAddTextClick}
      >
        Text
      </button>
    </div>

      {/* Default Upload Section */}
      {sidebarMode === 'default' && (
        <div className={styles.uploadSection}>
          <div 
            className={`${styles.dropZone} ${dragActive ? styles.dragOver : ""}`}
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Image
              src={downloadicon}
              alt="Upload Icon"
              width={40}
              height={40}
              className={styles.dropIcon}
            />
            <p>Drag & drop your logos here, or click to browse</p>
            {fileName && <p className={styles.fileName}>Selected: {fileName}</p>}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              ref={fileInputRef}
              style={{ display: "none" }}
            />
          </div>
          <div className={styles.buttonInfoGroup}>
            {logoCount > 0 && (
              <p className={styles.logoCount}>
                {logoCount} logo{logoCount !== 1 ? 's' : ''} added
              </p>
            )}
            <button onClick={handleClick} className={styles.addLogoButton}>
              Add {logoCount > 0 ? 'Another' : 'New'} Logo
            </button>
            <button onClick={handleAddTextClick} className={styles.textButton}>         
              Add Text
            </button>
          </div>
        </div>
      )}

      {/* Text Input Section */}
      {sidebarMode === 'text' && (
        <div className={styles.textInputSection}>
          <h3>{activeLogoId ? 'Edit Text' : 'Add New Text:'}</h3>
          
          <div className={styles.formGroup}>
            <textarea
              id="text-input"
              value={textInput}
              onChange={handleTextChange}
              className={styles.textArea}
              rows={3}
              placeholder="Enter your text here"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="font-family">Font:</label>
            <select 
              id="font-family" 
              value={textStyle.fontFamily}
              onChange={handleFontFamilyChange}
              className={styles.select}
            >
              <option value="Arial">Arial</option>
              <option value="Verdana">Verdana</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="font-size">Size: {textStyle.fontSize}px</label>
            <input
              id="font-size"
              type="range"
              min="10"
              max="64"
              value={textStyle.fontSize}
              onChange={handleFontSizeChange}
              className={styles.slider}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="text-color">Color:</label>
            <div className={styles.colorPickerContainer}>
              <input
                id="text-color"
                type="color"
                value={textStyle.color}
                onChange={handleColorChange}
                className={styles.colorPicker}
              />
              <span className={styles.colorValue}>{textStyle.color}</span>
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="font-weight">Style:</label>
            <select
              id="font-weight"
              value={textStyle.fontWeight}
              onChange={handleFontWeightChange}
              className={styles.select}
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
            </select>
          </div>

          <div className={styles.formGroup}>
          <label htmlFor="text-rotation">Rotation: {textStyle.rotation}°</label>
          <input
            id="text-rotation"
            type="range"
            min="-180"
            max="180"
            value={textStyle.rotation || 0}
            onChange={handleRotationChange}
            className={styles.slider}
          />
        </div>

        <div 
        className={styles.textPreview} 
        style={{
          fontFamily: textStyle.fontFamily,
          fontSize: `${textStyle.fontSize}px`,
          fontWeight: textStyle.fontWeight,
          color: textStyle.color,
          transform: `rotate(${textStyle.rotation || 0}deg)`, // just for testing remove rotation preview after
          transformOrigin: 'center center'
        }}
      >
        {textInput || "Preview"}
      </div>

          <div className={styles.buttonGroupText}>
            <button 
              onClick={applyTextChanges} 
              className={styles.applyButton}
            >
              {activeLogoId ? 'Update Text' : 'Add to Design'}
            </button>
            <button 
              onClick={cancelTextChanges} 
              className={styles.resetButton}
            >
              Cancel
            </button>
          </div>
          
          {/* Download Design Button - always visible regardless of mode */}
          <div className={styles.downloadButtonContainer}>
            <button 
              onClick={() => {
                if (typeof downloadDesign === 'function') {
                  downloadDesign();
                } else {
                  console.error("No download function available");
                  alert("Unable to download design at this time.");
                }
              }}
              className={styles.downloadButton}
            >
              Download Design
            </button>
          </div>
        </div>
      )}

      {/* Only show these sections in default mode */}
      {sidebarMode === 'default' && (
        <>
          <div className={styles.infoLinkContainer}>
            <Link href="/orderinfo" className={styles.infoLink}>
              Image Upload Details
            </Link>
            <span className={styles.linkSeparator}>-</span>
            <button 
              onClick={() => setShowBlueprintExample(true)}
              className={styles.infoLink}
            >
              Blueprint Example
            </button>
          </div>
          
          <div className={styles.dimensionContainer}>
            <h3 className={styles.sectionTitle}>Customize Your Bag Dimensions</h3>
            <div className={styles.dimensionInputs}>
              <div className={styles.inputGroup}>
                <label htmlFor="length">Length (in)</label>
                <input
                  type="number"
                  id="length"
                  name="length"
                  value={inputValues.length}
                  onChange={onDimensionChange}
                  onKeyDown={onDimensionKeyDown}
                  min={MIN_DIMENSIONS.length}
                  max={MAX_DIMENSIONS.length}
                  step="0.01"
                  className={getInputClass('length')}
                />
                <div className={styles.dimensionLimits}>
                  <span className={styles.minDimension}>Min: {MIN_DIMENSIONS.length}&quot;</span>
                  <span className={styles.maxDimension}>Max: {MAX_DIMENSIONS.length}&quot;</span>
                </div>
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="width">Width (in)</label>
                <input
                  type="number"
                  id="width"
                  name="width"
                  value={inputValues.width}
                  onChange={onDimensionChange}
                  onKeyDown={onDimensionKeyDown}
                  min={MIN_DIMENSIONS.width}
                  max={MAX_DIMENSIONS.width}
                  step="0.01"
                  className={getInputClass('width')}
                />
                <div className={styles.dimensionLimits}>
                  <span className={styles.minDimension}>Min: {MIN_DIMENSIONS.width}&quot;</span>
                  <span className={styles.maxDimension}>Max: {MAX_DIMENSIONS.width}&quot;</span>
                </div>
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="height">Height (in)</label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={inputValues.height}
                  onChange={onDimensionChange}
                  onKeyDown={onDimensionKeyDown}
                  min={MIN_DIMENSIONS.height}
                  max={MAX_DIMENSIONS.height}
                  step="0.01"
                  className={getInputClass('height')}
                />
                <div className={styles.dimensionLimits}>
                  <span className={styles.minDimension}>Min: {MIN_DIMENSIONS.height}&quot;</span>
                  <span className={styles.maxDimension}>Max: {MAX_DIMENSIONS.height}&quot;</span>
                </div>
              </div>
            </div>
            
            {/* Buttons to apply or reset dimensions */}
            <div className={styles.buttonGroup}>
              <button 
                onClick={applyDimensions} 
                className={styles.applyButton}
                disabled={!dimensionsChanged()}
              >
                Apply Dimensions
              </button>
              <button 
                onClick={resetDimensions} 
                className={styles.resetButton}
                disabled={!dimensionsChanged()}
              >
                Reset
              </button>
            </div>

            {/* Download Design Button */}
            <div className={styles.downloadButtonContainer}>
              <button 
                onClick={() => {
                  if (typeof downloadDesign === 'function') {
                    downloadDesign();
                  } else {
                    console.error("No download function available");
                    alert("Unable to download design at this time.");
                  }
                }}
                className={styles.downloadButton}
              >
                Download Design
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* Blueprint Example Modal - available regardless of mode */}
      {showBlueprintExample && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <button 
              className={styles.closeButton} 
              onClick={() => setShowBlueprintExample(false)}
            >
              &times;
            </button>
            <div className={styles.blueprintImageContainer}>
              <Image
                src={BlueprintExample}
                alt="Blueprint Example"
                width={1400}
                height={1200}
                className={styles.blueprintImage}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;