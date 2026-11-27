const configurarPainel = () => chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error)

chrome.runtime.onInstalled.addListener(configurarPainel)
chrome.runtime.onStartup.addListener(configurarPainel)
