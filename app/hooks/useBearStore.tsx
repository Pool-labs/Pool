import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// Define the Bear state interface
interface BearState {
  bears: number;
  berries: number;
  environment: {
    forest: {
      treeCount: number;
      riverSize: number;
    };
  };
  // Actions
  increasePopulation: () => void;
  decreasePopulation: () => void;
  removeAllBears: () => void;
  feedBears: (berryCount: number) => void;
  plantTrees: (count: number) => void;
}

// Create the store with TypeScript typing and persistence
const useBearStore = create<BearState>()(
  devtools(
    persist(
      (set) => ({
  bears: 0,
        berries: 100,
        environment: {
          forest: {
            treeCount: 50,
            riverSize: 10,
          },
        },
        
        // Add a bear to the population
        increasePopulation: () => 
          set(
            (state) => ({ bears: state.bears + 1 }),
            false, 
            'bears/increasePopulation'
          ),
        
        // Remove a bear from the population (if possible)
        decreasePopulation: () => 
          set(
            (state) => ({ bears: state.bears > 0 ? state.bears - 1 : 0 }),
            false,
            'bears/decreasePopulation'
          ),
        
        // Reset bear population to zero
        removeAllBears: () => 
          set(
            { bears: 0 },
            false,
            'bears/removeAllBears'
          ),
        
        // Feed bears with berries
        feedBears: (berryCount) => 
          set(
            (state) => ({
              berries: state.berries > berryCount 
                ? state.berries - berryCount 
                : 0
            }),
            false,
            { type: 'bears/feedBears', berryCount }
          ),
        
        // Plant trees in the forest
        plantTrees: (count) => 
          set(
            (state) => ({
              environment: {
                ...state.environment,
                forest: {
                  ...state.environment.forest,
                  treeCount: state.environment.forest.treeCount + count
                }
              }
            }),
            false,
            { type: 'bears/plantTrees', count }
          ),
      }),
      {
        name: 'bear-storage', // unique name for localStorage
      }
    )
  )
)

export default useBearStore;