import { addButtonListeners } from "./addButtonListeners";
import { addHideOneTimeConfigListener } from "./addHideOneTimeConfigListener";
import { addSelectListeners } from "./addSelectListeners";
import { addToogleListeners } from "./addToggleListeners";
import { addWindowTitleListeners } from "./addWindowTitleListeners";
import { addZoomListeners } from "./addZoomListeners";

export function addListeners() {
    addToogleListeners();
    addSelectListeners();
    addButtonListeners();
    addZoomListeners();
    addWindowTitleListeners();
    addHideOneTimeConfigListener();
}
