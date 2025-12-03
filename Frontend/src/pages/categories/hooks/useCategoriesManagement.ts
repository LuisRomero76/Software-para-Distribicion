import { useEffect, useState } from 'react';
import {
  getAllCategories,
  getAllSubCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  type Category,
  type SubCategory,
} from '../../../services/categoryService';

export function useCategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

  const [nombre, setNombre] = useState('');
  const [subNombre, setSubNombre] = useState('');
  const [subCategoryId, setSubCategoryId] = useState<number | ''>('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNombre, setEditingNombre] = useState('');
  const [editingSubId, setEditingSubId] = useState<number | null>(null);
  const [editingSubNombre, setEditingSubNombre] = useState('');
  const [editingSubCategoryId, setEditingSubCategoryId] = useState<number | ''>('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [showDeleteSubModal, setShowDeleteSubModal] = useState(false);
  const [subCategoryToDelete, setSubCategoryToDelete] = useState<number | null>(null);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadCategories();
    loadSubCategories();
  }, []);

  async function loadCategories() {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      flashError('Error al cargar las categorías');
    }
  }

  async function loadSubCategories() {
    try {
      const data = await getAllSubCategories();
      setSubCategories(data);
    } catch (error) {
      console.error('Error al cargar subcategorías:', error);
      flashError('Error al cargar las subcategorías');
    }
  }

  function flashError(msg: string) {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 3000);
  }
  function flashSuccess(msg: string) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  }

  async function submitCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return flashError('El nombre es obligatorio');
    try {
      await createCategory({ nombre: nombre.trim() });
      setNombre('');
      await Promise.all([loadCategories(), loadSubCategories()]);
      flashSuccess('Categoría agregada exitosamente');
    } catch (error) {
      console.error('Error al crear categoría:', error);
      flashError('Error al crear la categoría');
    }
  }

  function startEditCategory(category: Category) {
    setEditingId(category.category_id);
    setEditingNombre(category.nombre);
  }

  async function saveEditCategory(id: number) {
    if (!editingNombre.trim()) return flashError('El nombre es obligatorio');
    try {
      await updateCategory(id, { nombre: editingNombre.trim() });
      setEditingId(null);
      setEditingNombre('');
      await Promise.all([loadCategories(), loadSubCategories()]);
      flashSuccess('Categoría actualizada exitosamente');
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      flashError('Error al actualizar la categoría');
    }
  }

  function cancelEditCategory() {
    setEditingId(null);
    setEditingNombre('');
  }

  function askDeleteCategory(id: number) {
    setCategoryToDelete(id);
    setShowDeleteModal(true);
  }

  async function confirmDeleteCategory() {
    if (categoryToDelete === null) return;
    try {
      await deleteCategory(categoryToDelete);
      await Promise.all([loadCategories(), loadSubCategories()]);
      flashSuccess('Categoría eliminada exitosamente');
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      flashError('Error al eliminar la categoría');
    } finally {
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  }

  function cancelDeleteCategory() {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  }

  async function submitSubCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!subNombre.trim() || subCategoryId === '') return flashError('Todos los campos son obligatorios');
    try {
      await createSubCategory({ nombre: subNombre.trim(), category_id: Number(subCategoryId) });
      setSubNombre('');
      setSubCategoryId('');
      await loadSubCategories();
      flashSuccess('Subcategoría agregada exitosamente');
    } catch (error) {
      console.error('Error al crear subcategoría:', error);
      flashError('Error al crear la subcategoría');
    }
  }

  function startEditSubCategory(sc: SubCategory) {
    setEditingSubId(sc.sub_category_id);
    setEditingSubNombre(sc.nombre);
    setEditingSubCategoryId(sc.category_id);
  }

  async function saveEditSubCategory(id: number) {
    if (!editingSubNombre.trim() || editingSubCategoryId === '') return flashError('Todos los campos son obligatorios');
    try {
      await updateSubCategory(id, { nombre: editingSubNombre.trim(), category_id: Number(editingSubCategoryId) });
      setEditingSubId(null);
      setEditingSubNombre('');
      setEditingSubCategoryId('');
      await loadSubCategories();
      flashSuccess('Subcategoría actualizada exitosamente');
    } catch (error) {
      console.error('Error al actualizar subcategoría:', error);
      flashError('Error al actualizar la subcategoría');
    }
  }

  function cancelEditSubCategory() {
    setEditingSubId(null);
    setEditingSubNombre('');
    setEditingSubCategoryId('');
  }

  function askDeleteSubCategory(id: number) {
    setSubCategoryToDelete(id);
    setShowDeleteSubModal(true);
  }

  async function confirmDeleteSubCategory() {
    if (subCategoryToDelete === null) return;
    try {
      await deleteSubCategory(subCategoryToDelete);
      await loadSubCategories();
      flashSuccess('Subcategoría eliminada exitosamente');
    } catch (error) {
      console.error('Error al eliminar subcategoría:', error);
      flashError('Error al eliminar la subcategoría');
    } finally {
      setShowDeleteSubModal(false);
      setSubCategoryToDelete(null);
    }
  }

  function cancelDeleteSubCategory() {
    setShowDeleteSubModal(false);
    setSubCategoryToDelete(null);
  }

  return {
    // data
    categories,
    subCategories,
    // feedback
    successMessage,
    errorMessage,
    // forms state
    nombre,
    setNombre,
    subNombre,
    setSubNombre,
    subCategoryId,
    setSubCategoryId,
    // editing state
    editingId,
    editingNombre,
    setEditingNombre,
    editingSubId,
    editingSubNombre,
    setEditingSubNombre,
    editingSubCategoryId,
    setEditingSubCategoryId,
    // delete modal state
    showDeleteModal,
    categoryToDelete,
    showDeleteSubModal,
    subCategoryToDelete,
    // actions - category
    submitCategory,
    startEditCategory,
    saveEditCategory,
    cancelEditCategory,
    askDeleteCategory,
    confirmDeleteCategory,
    cancelDeleteCategory,
    // actions - subcategory
    submitSubCategory,
    startEditSubCategory,
    saveEditSubCategory,
    cancelEditSubCategory,
    askDeleteSubCategory,
    confirmDeleteSubCategory,
    cancelDeleteSubCategory,
  };
}
