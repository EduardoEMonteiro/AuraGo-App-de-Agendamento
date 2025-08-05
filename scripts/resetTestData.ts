import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';

export async function resetAllTestData() {
  console.log('🧹 Iniciando limpeza de dados de teste...');
  
  try {
    // Lista de todas as coleções para limpar
    const collectionsToClean = [
      'saloes',
      'usuarios', 
      'bloqueios',
      'configuracoes'
    ];

    for (const collectionName of collectionsToClean) {
      console.log(`🗑️ Limpando coleção: ${collectionName}`);
      
      const snapshot = await getDocs(collection(db, collectionName));
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      
      await Promise.all(deletePromises);
      console.log(`✅ ${snapshot.docs.length} documentos removidos de ${collectionName}`);
    }

    console.log('🎉 Limpeza concluída com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
    throw error;
  }
} 