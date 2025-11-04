import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { VaultDetail as VaultDetailComponent } from '../components/marketplace/VaultDetail';
import { questValidation } from '../services/questValidation';

const VaultDetail = () => {
  const { vaultId } = useParams<{ vaultId: string }>();
  
  useEffect(() => {
    if (vaultId) {
      // Track page visit for quest validation
      questValidation.trackPageVisit('vault_detail');
      
      // Check if user spent enough time viewing vault details
      const timer = setTimeout(() => {
        questValidation.validateViewVaultDetails();
      }, 10000); // 10 seconds
      
      return () => {
        clearTimeout(timer);
        questValidation.clearPageVisit('vault_detail');
      };
    }
  }, [vaultId]);

  if (!vaultId) {
    return (
      <div className="h-full bg-app flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-neutral-50">
            Vault Not Found
          </h2>
          <p className="text-neutral-400">
            The requested vault could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-app overflow-auto">
      <div className="container mx-auto px-4 py-8 pb-16 max-w-6xl">
        <VaultDetailComponent vaultId={vaultId} />
      </div>
    </div>
  );
};

export default VaultDetail;
