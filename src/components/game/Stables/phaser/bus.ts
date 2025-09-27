// src/components/game/Stables/phaser/bus.ts
import mitt from 'mitt';
import type { Horse } from '../types/horse';

type Events = {
  'ui:open-horse': number;       // ← open SingleHorse for this id
  'ui:close-horse': undefined;   // ← close SingleHorse
  'ui:open-bag': undefined;
  'ui:click': undefined;
  'hud:show': undefined;
  'hud:hide': undefined;

  // NEW:
  'horses:update': Horse[];   // React -> Phaser (push latest list)
  'horses:request': undefined; // Phaser -> React (ask for current list)

  'game:horse:changed': undefined;

  'ui:profile-bounds': { left: number; top: number; width: number; height: number };

  'horse:burn': { id: number };
  'horse:open': { id: number };
  'horse:race': { id: number };
  'horse:restore' : { id: number};
};

export const bus = mitt<Events>();
