// src/components/game/Stables/phaser/bus.ts
import mitt from 'mitt';
import type { Horse } from '../types/horse';

type Events = {
  'ui:open-bag': undefined;
  'ui:click': undefined;
  'hud:show': undefined;
  'hud:hide': undefined;

  // NEW:
  'horses:update': Horse[];   // React -> Phaser (push latest list)
  'horses:request': undefined; // Phaser -> React (ask for current list)

  'game:horse:changed': undefined;
};

export const bus = mitt<Events>();
