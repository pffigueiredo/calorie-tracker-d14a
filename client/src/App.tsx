
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarIcon, Plus, Edit, Trash2, Apple, TrendingUp } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import type { FoodEntry, CreateFoodEntryInput, UpdateFoodEntryInput, DailySummary } from '../../server/src/schema';

function App() {
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Form state for adding new entries
  const [addFormData, setAddFormData] = useState<CreateFoodEntryInput>({
    name: '',
    calories: 0,
    consumed_at: new Date()
  });

  // Form state for editing entries
  const [editFormData, setEditFormData] = useState<UpdateFoodEntryInput>({
    id: 0,
    name: '',
    calories: 0,
    consumed_at: new Date()
  });

  // Load all food entries
  const loadFoodEntries = useCallback(async () => {
    try {
      const result = await trpc.getFoodEntries.query();
      setFoodEntries(result);
    } catch (error) {
      console.error('Failed to load food entries:', error);
    }
  }, []);

  // Load daily summary for selected date
  const loadDailySummary = useCallback(async (date: Date) => {
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      const result = await trpc.getDailySummary.query({ date: dateString });
      setDailySummary(result);
    } catch (error) {
      console.error('Failed to load daily summary:', error);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadFoodEntries();
    loadDailySummary(selectedDate);
  }, [loadFoodEntries, loadDailySummary, selectedDate]);

  // Handle adding new food entry
  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createFoodEntry.mutate(addFormData);
      setFoodEntries((prev: FoodEntry[]) => [response, ...prev]);
      
      // Refresh daily summary if the entry is for the selected date
      const entryDate = format(new Date(addFormData.consumed_at), 'yyyy-MM-dd');
      const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
      if (entryDate === selectedDateString) {
        await loadDailySummary(selectedDate);
      }
      
      // Reset form and close dialog
      setAddFormData({
        name: '',
        calories: 0,
        consumed_at: new Date()
      });
      setShowAddDialog(false);
    } catch (error) {
      console.error('Failed to create food entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle editing food entry
  const handleEditEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.updateFoodEntry.mutate(editFormData);
      setFoodEntries((prev: FoodEntry[]) =>
        prev.map((entry: FoodEntry) => entry.id === response.id ? response : entry)
      );
      
      // Refresh daily summary
      await loadDailySummary(selectedDate);
      
      setShowEditDialog(false);
    } catch (error) {
      console.error('Failed to update food entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting food entry
  const handleDeleteEntry = async (id: number) => {
    try {
      await trpc.deleteFoodEntry.mutate(id);
      setFoodEntries((prev: FoodEntry[]) => prev.filter((entry: FoodEntry) => entry.id !== id));
      
      // Refresh daily summary
      await loadDailySummary(selectedDate);
    } catch (error) {
      console.error('Failed to delete food entry:', error);
    }
  };

  // Prepare edit form when editing an entry
  const startEditEntry = (entry: FoodEntry) => {
    setEditFormData({
      id: entry.id,
      name: entry.name,
      calories: entry.calories,
      consumed_at: entry.consumed_at
    });
    setShowEditDialog(true);
  };

  // Filter entries for the selected date
  const entriesForSelectedDate = foodEntries.filter((entry: FoodEntry) => {
    const entryDate = format(new Date(entry.consumed_at), 'yyyy-MM-dd');
    const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
    return entryDate === selectedDateString;
  });

  // Calculate average calories with proper null checks
  const calculateAverageCalories = () => {
    if (!dailySummary || !dailySummary.entry_count || dailySummary.entry_count === 0) {
      return 0;
    }
    return Math.round(dailySummary.total_calories / dailySummary.entry_count);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            <Apple className="h-8 w-8 text-green-600" />
            🥗 Calorie Tracker
          </h1>
          <p className="text-gray-600">Track your daily nutrition and stay healthy!</p>
        </div>

        {/* Daily Summary Card */}
        <Card className="mb-6 bg-gradient-to-r from-green-100 to-blue-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <TrendingUp className="h-5 w-5" />
              Daily Summary - {format(selectedDate, 'MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {dailySummary?.total_calories || 0}
                </div>
                <div className="text-sm text-gray-600">Total Calories 🔥</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {dailySummary?.entry_count || 0}
                </div>
                <div className="text-sm text-gray-600">Food Items 🍽️</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {calculateAverageCalories()}
                </div>
                <div className="text-sm text-gray-600">Avg per Item ⚖️</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Date Picker & Actions */}
          <div className="lg:col-span-1">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">📅 Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date: Date | undefined) => {
                        if (date) {
                          setSelectedDate(date);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            {/* Add Entry Button */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="w-full mb-4 bg-green-600 hover:bg-green-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Food Entry 🍎
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Food Entry 🍽️</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddEntry} className="space-y-4">
                  <Input
                    placeholder="Food name (e.g., Grilled Chicken)"
                    value={addFormData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAddFormData((prev: CreateFoodEntryInput) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Calories"
                    value={addFormData.calories}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAddFormData((prev: CreateFoodEntryInput) => ({ 
                        ...prev, 
                        calories: parseFloat(e.target.value) || 0 
                      }))
                    }
                    min="0"
                    step="1"
                    required
                  />
                  <Input
                    type="datetime-local"
                    value={format(addFormData.consumed_at, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAddFormData((prev: CreateFoodEntryInput) => ({ 
                        ...prev, 
                        consumed_at: new Date(e.target.value) 
                      }))
                    }
                    required
                  />
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Adding...' : 'Add Entry 🎉'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Food Entries List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>🍽️ Food Entries for {format(selectedDate, 'MMM d')}</span>
                  <Badge variant="secondary">
                    {entriesForSelectedDate.length} items
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {entriesForSelectedDate.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Apple className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg mb-2">No food entries for this date 📝</p>
                    <p className="text-sm">Click "Add Food Entry" to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {entriesForSelectedDate
                      .sort((a: FoodEntry, b: FoodEntry) => 
                        new Date(b.consumed_at).getTime() - new Date(a.consumed_at).getTime()
                      )
                      .map((entry: FoodEntry) => (
                        <div key={entry.id} className="border rounded-lg p-4 bg-white shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-gray-800">
                                🍴 {entry.name}
                              </h3>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  🔥 <strong>{entry.calories}</strong> calories
                                </span>
                                <span className="flex items-center gap-1">
                                  ⏰ {format(new Date(entry.consumed_at), 'h:mm a')}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Added: {format(new Date(entry.created_at), 'MMM d, h:mm a')}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditEntry(entry)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Food Entry? 🗑️</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{entry.name}"? 
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteEntry(entry.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* All Entries Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📋 All Food Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {foodEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg mb-2">No food entries yet 📝</p>
                <p className="text-sm">Start tracking your meals today!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {foodEntries
                  .sort((a: FoodEntry, b: FoodEntry) => 
                    new Date(b.consumed_at).getTime() - new Date(a.consumed_at).getTime()
                  )
                  .map((entry: FoodEntry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{entry.name}</span>
                        <span className="text-sm text-gray-600 ml-2">
                          ({entry.calories} cal)
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(entry.consumed_at), 'MMM d, h:mm a')}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Food Entry ✏️</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditEntry} className="space-y-4">
              <Input
                placeholder="Food name"
                value={editFormData.name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: UpdateFoodEntryInput) => ({ ...prev, name: e.target.value }))
                }
                required
              />
              <Input
                type="number"
                placeholder="Calories"
                value={editFormData.calories || 0}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: UpdateFoodEntryInput) => ({ 
                    ...prev, 
                    calories: parseFloat(e.target.value) || 0 
                  }))
                }
                min="0"
                step="1"
                required
              />
              <Input
                type="datetime-local"
                value={editFormData.consumed_at ? format(new Date(editFormData.consumed_at), "yyyy-MM-dd'T'HH:mm") : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: UpdateFoodEntryInput) => ({ 
                    ...prev, 
                    consumed_at: new Date(e.target.value) 
                  }))
                }
                required
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Updating...' : 'Update Entry 💾'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>🌟 Stay healthy, stay happy! Track your nutrition journey. 🌟</p>
        </div>
      </div>
    </div>
  );
}

export default App;
