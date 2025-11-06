/**
 * WASM Optimizer Utility
 * Cloud-native WASM optimization for Soroban deployment (Heroku-friendly)
 * No external tools required - works purely in Node.js
 */

export interface OptimizationResult {
  success: boolean;
  optimizedWasm?: Buffer;
  originalSize: number;
  optimizedSize?: number;
  compressionRatio?: number;
  method: 'stellar-cli' | 'wasm-opt' | 'none';
  error?: string;
  warnings?: string[];
}

/**
 * Check if WASM is already optimized for Soroban
 */
export function isWasmOptimized(wasmBuffer: Buffer): boolean {
  // Basic heuristics to detect if WASM is already optimized:
  // 1. Check if it's very small (likely optimized)
  // 2. Check for Soroban-specific patterns
  // 3. No debug sections
  
  const size = wasmBuffer.length;
  
  // If it's under 100KB, it's likely optimized
  if (size < 100 * 1024) {
    return true;
  }
  
  // Check for debug sections (unoptimized WASMs have these)
  const wasmString = wasmBuffer.toString('binary');
  const hasDebugInfo = wasmString.includes('name') && 
                       wasmString.includes('producers') &&
                       size > 200 * 1024;
  
  return !hasDebugInfo;
}

// Note: External optimization tools (stellar-cli, wasm-opt) are not used
// because they're not available in cloud environments like Heroku.
// Users should upload .optimized.wasm files for best results.
// The repairWasm function below provides basic optimization by stripping debug sections.

/**
 * Main optimization function
 * Cloud-friendly: Uses repair method only (no external tools required)
 * For production Heroku deployments where stellar-cli is not available
 */
export async function optimizeWasm(wasmBuffer: Buffer): Promise<OptimizationResult> {
  const originalSize = wasmBuffer.length;
  console.log(`[WASM Optimizer] Starting optimization for ${originalSize} byte WASM...`);
  
  // Check if already optimized (small size, no debug sections)
  if (isWasmOptimized(wasmBuffer)) {
    console.log('[WASM Optimizer] ℹ️  WASM appears already optimized (small size, no debug sections)');
    return {
      success: true,
      optimizedWasm: wasmBuffer,
      originalSize,
      optimizedSize: originalSize,
      compressionRatio: 0,
      method: 'none',
      warnings: ['WASM appears already optimized'],
    };
  }
  
  // Primary method: Strip debug sections (works everywhere, no external tools)
  console.log('[WASM Optimizer] Stripping debug sections and cleaning WASM...');
  const repairResult = repairWasm(wasmBuffer);
  if (repairResult.repaired && repairResult.wasm.length < wasmBuffer.length) {
    const compressionRatio = ((wasmBuffer.length - repairResult.wasm.length) / wasmBuffer.length * 100).toFixed(1);
    console.log(`[WASM Optimizer] ✅ Optimized: ${originalSize} → ${repairResult.wasm.length} bytes (${compressionRatio}% reduction)`);
    return {
      success: true,
      optimizedWasm: repairResult.wasm,
      originalSize,
      optimizedSize: repairResult.wasm.length,
      compressionRatio: parseFloat(compressionRatio),
      method: 'none',
      warnings: [
        'WASM optimized by stripping debug sections',
        'For best results, upload .optimized.wasm files pre-compiled with stellar-cli',
      ],
    };
  }
  
  // If WASM is already clean, just use it
  console.log('[WASM Optimizer] WASM is clean, using as-is');
  return {
    success: true,
    optimizedWasm: wasmBuffer,
    originalSize,
    optimizedSize: originalSize,
    compressionRatio: 0,
    method: 'none',
    warnings: [
      'WASM used as-is (no optimization needed)',
      'If upload fails, please use an .optimized.wasm file compiled with stellar-cli locally',
    ],
  };
}

/**
 * Attempt to repair common WASM issues
 * This is a last-resort fallback when optimization tools fail
 */
function repairWasm(wasmBuffer: Buffer): { repaired: boolean; wasm: Buffer; message?: string } {
  try {
    // For section size mismatch errors, try to rebuild the WASM
    // This is a simplified repair - just strip known problematic sections
    
    const magic = wasmBuffer.slice(0, 4);
    const version = wasmBuffer.slice(4, 8);
    
    // Start with header
    const sections: Buffer[] = [magic, version];
    let offset = 8;
    
    // Parse sections and skip malformed ones
    while (offset < wasmBuffer.length) {
      if (offset + 5 > wasmBuffer.length) break;
      
      const sectionId = wasmBuffer[offset];
      offset++;
      
      // Read section size (LEB128 encoded)
      let size = 0;
      let shift = 0;
      let byte;
      const sizeStart = offset;
      
      do {
        if (offset >= wasmBuffer.length) break;
        byte = wasmBuffer[offset++];
        size |= (byte & 0x7F) << shift;
        shift += 7;
      } while (byte & 0x80);
      
      const sizeBytes = offset - sizeStart;
      
      // Check if we have enough data for this section
      if (offset + size > wasmBuffer.length) {
        console.warn(`[WASM Repair] Skipping malformed section ${sectionId} at offset ${offset - sizeBytes - 1}`);
        break; // Stop here, rest is corrupted
      }
      
      // Skip debug-related sections (name, producers, source maps)
      if (sectionId === 0 && size > 0) {
        // Custom section - check if it's debug info
        const nameLen = wasmBuffer[offset];
        if (offset + nameLen < wasmBuffer.length) {
          const sectionName = wasmBuffer.slice(offset + 1, offset + 1 + nameLen).toString();
          if (sectionName === 'name' || sectionName === 'producers' || sectionName.includes('sourceMappingURL')) {
            console.log(`[WASM Repair] Stripping debug section: ${sectionName}`);
            offset += size;
            continue;
          }
        }
      }
      
      // Add this section
      sections.push(Buffer.from([sectionId]));
      sections.push(wasmBuffer.slice(sizeStart, offset));
      sections.push(wasmBuffer.slice(offset, offset + size));
      offset += size;
    }
    
    const repairedWasm = Buffer.concat(sections);
    
    if (repairedWasm.length < wasmBuffer.length) {
      console.log(`[WASM Repair] ✅ Repaired WASM: ${wasmBuffer.length} → ${repairedWasm.length} bytes`);
      return {
        repaired: true,
        wasm: repairedWasm,
        message: `Automatically repaired WASM (removed ${wasmBuffer.length - repairedWasm.length} bytes of problematic sections)`,
      };
    }
    
    return { repaired: false, wasm: wasmBuffer };
  } catch (error: any) {
    console.error('[WASM Repair] Repair failed:', error);
    return { repaired: false, wasm: wasmBuffer };
  }
}

/**
 * Validate WASM format
 */
export function validateWasm(wasmBuffer: Buffer): { valid: boolean; error?: string } {
  try {
    // Check WASM magic number (0x00 0x61 0x73 0x6d)
    const magicNumber = wasmBuffer.slice(0, 4);
    if (magicNumber.toString('hex') !== '0061736d') {
      return {
        valid: false,
        error: 'Invalid WASM file: Missing magic number. File may be corrupted.',
      };
    }
    
    // Check WASM version (1)
    const version = wasmBuffer.readUInt32LE(4);
    if (version !== 1) {
      return {
        valid: false,
        error: `Unsupported WASM version: ${version}. Expected version 1.`,
      };
    }
    
    // Minimum size check
    if (wasmBuffer.length < 8) {
      return {
        valid: false,
        error: 'WASM file too small to be valid.',
      };
    }
    
    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      error: `WASM validation error: ${error.message}`,
    };
  }
}
