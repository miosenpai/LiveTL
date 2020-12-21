params = parseParams();
const v = params.v || '5qap5aO4i9A';
const stream = document.querySelector('#stream');
const leftPanelContainer = document.querySelector('#videoPanel');
const ltlchat = document.querySelector('#livetl-chat');
const chat = document.querySelector('#chat');
const videoPanel = document.querySelector('#videoPanel');
const liveTLPanel = document.querySelector('#ltlPanel');
const outputPanel = document.querySelector('#outputPanel');
const youtubeChatPanel = document.querySelector('#youtubeChatPanel');
document.title = decodeURIComponent(params.title || 'LiveTL');
const start = () => {
  leftPanelContainer.querySelectorAll('*').forEach(node => {
    node.style.display = 'none';
  });
  // stream.style.display = 'none';
  ltlchat.style.display = 'none';
  chat.style.display = 'none';
  videoPanel.style.backgroundColor = 'var(--accent)';
  outputPanel.style.backgroundColor = 'var(--accent)';
  youtubeChatPanel.style.backgroundColor = 'var(--accent)';
};
const stop = () => {
  // stream.style.display = 'block';
  leftPanelContainer.querySelectorAll('*').forEach(node => {
    node.style.display = 'block';
  });
  ltlchat.style.display = 'block';
  chat.style.display = 'block';
  videoPanel.style.backgroundColor = 'black';
  outputPanel.style.backgroundColor = 'black';
  youtubeChatPanel.style.backgroundColor = 'black';
  localStorage.setItem('LTL:rightPanelHeight', youtubeChatPanel.style.height);
  const width = getPaneWidth();
  if (isNaN(width) === false) {
    localStorage.setItem('LTL:leftPanelWidth', width.toString());
  }
};

$('#youtubeChatPanel').resizable({
  handles: {
    s: '#handleH'
  },
  start: start,
  stop: stop
});

// resizing yoinked and modified from https://spin.atomicobject.com/2019/11/21/creating-a-resizable-html-element/
const getResizeableElement = () => document.getElementById('videoPanel');
const getHandleElement = () => document.getElementById('handleV');

const setPaneWidth = (width) => {
  if (width > window.innerWidth - 150)
    return;

  getResizeableElement().style
    .setProperty('--resizeable-width', `${width}px`);
};

const getPaneWidth = () => {
  const pxWidth = getComputedStyle(getResizeableElement())
    .getPropertyValue('--resizeable-width');
  return parseInt(pxWidth, 10);
};

const startDragging = (event) => {
  event.preventDefault();
  start();
  getResizeableElement();

  const startingPaneWidth = getPaneWidth();
  const xOffset = event.pageX;

  const mouseUp = () => {
    setPaneWidth(getPaneWidth());
    document.body.removeEventListener('mousemove', mouseDragHandler);
    stop();
  };

  const mouseDragHandler = async (moveEvent) => {
    moveEvent.preventDefault();

    const primaryButtonPressed = moveEvent.buttons === 1;
    if (!primaryButtonPressed) {
      mouseUp();
    }

    const paneOriginAdjustment = await getStorage('chatSide') === 'left' ? 1 : -1;
    setPaneWidth((xOffset - moveEvent.pageX) * paneOriginAdjustment + startingPaneWidth);
  };

  document.body.addEventListener('mousemove', mouseDragHandler);
  document.body.addEventListener('mouseup', mouseUp);
};

getStorage('chatSide').then(side => {
  if (side === 'right') {
    videoPanel.style.order = '1';
    liveTLPanel.style.order = '3';
  } else if (side === 'left') {
    videoPanel.style.order = '3';
    liveTLPanel.style.order = '1';
  }
});

getHandleElement().addEventListener('mousedown', startDragging);

window.addEventListener('resize', () => {
  if (getPaneWidth() > window.innerWidth - 150) {
    setPaneWidth(window.innerWidth - 150);
  }
})

let c = params.continuation;
let r = params.isReplay;
r = r == null ? c : r;

window.addEventListener('message', d => {
  d = JSON.parse(JSON.stringify(d.data));

  try {
    chat.contentWindow.postMessage(d, '*');
    ltlchat.contentWindow.postMessage(d, '*');
  } catch (e) { }
});

let q = `?isReplay=${(r ? 1 : '')}&v=${v}${(c ? `&continuation=${c}` : '')}`;

(async () => {
  let main = await getWAR('index.html');
  let pop = await getWAR('popout/index.html');
  ltlchat.src = `${pop}${q}&useLiveTL=1&isReplay=${(r ? 1 : '')}`;
  if (window.location.href.startsWith(main)) {
    ltlchat.src = `${pop}${q}&useLiveTL=1`;
  }
})();

chat.src = embedDomain + q;

let leftWidth = localStorage.getItem('LTL:leftPanelWidth');
let rightHeight = localStorage.getItem('LTL:rightPanelHeight');

if (leftWidth) {
  setPaneWidth(leftWidth);
} else {
  setPaneWidth(Math.round(window.innerWidth * 0.8));
}

if (params.noVideo) {
  videoPanel.style.display = 'none';
  document.querySelector('#handleV').style.display = 'none';
} else {
  stream.src = `${embedDomain}?v=${v}&mode=video`;
  if (rightHeight) {
    youtubeChatPanel.style.height = rightHeight;
  }
}

// Not working rn
// $('#ltlcaptions').draggable({ start: function() {
//     $(this).css({transform: "none", top: $(this).offset().top+"px", left:$(this).offset().left+"px"});
// } });

function createCaptionSegment(segment) {
  let caption = document.createElement('p');
  caption.className = 'captionSegment';
  caption.textContent = segment;
  // May add animations later
  caption.removeSelf = () => {
    caption.remove();
  };
  return caption;
}

// Just here in case we need it later
function splitCaptionIntoSegments(caption, maxLength=100) {
  return [caption];
}

function displayCaption(caption, persistFor=-1, clear=true) {
  const captions = document.querySelector('#ltlcaptions');
  if (clear) {
    clearCaptions();
  }
  splitCaptionIntoSegments(caption)
    .map(createCaptionSegment)
    .map(caption => {
      captions.appendChild(caption);
      if (persistFor >= 0) {
        setTimeout(() => caption.removeSelf(), persistFor);
      }
    });
}

function clearCaptions() {
  const captions = document.querySelector('#ltlcaptions');
  captions.childNodes.forEach(node => node.remove());
}

window.addEventListener('message', async (event) => {
  let displayCaptions = await getStorage('captionMode');
  if (displayCaptions && event.data.action === 'caption') {
    displayCaption(event.data.caption, 10000);
  }
  if (event.data.action === 'clearCaption') {
    clearCaptions();
  }
});

// Demo call to displayCaption
// displayCaption("Oi koroneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneoneone", 1000, false);
