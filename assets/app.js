
(function () {
      'use strict';

      // 1. 初始化读取本地保存的历史工程
      const STORAGE_KEY = 'fire_tactical_card_projects';
      const recentListEl = document.getElementById('recent-projects-list');

      function loadSavedProjects() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return;
          const projects = JSON.parse(raw);
          if (!Array.isArray(projects) || projects.length === 0) return;

          // 清空默认单个条目，换成真实+示例
          recentListEl.innerHTML = '';

          projects.forEach(function (item) {
            const row = document.createElement('div');
            row.className = 'bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-os-sm hover:shadow-os-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group';

            const isVillage = item.type === 'village';
            const badgeColor = isVillage ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200';
            const iconBg = isVillage ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
            const iconClass = isVillage ? 'fa-tree-city' : 'fa-building-shield';
            const typeName = isVillage ? '村落模板' : '单体建筑';

            row.innerHTML = `
              <div class="flex items-center space-x-4">
                <div class="w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0">
                  <i class="fa-solid ${iconClass} text-lg"></i>
                </div>
                <div>
                  <div class="flex items-center space-x-2.5">
                    <h4 class="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">${escapeHtml(item.title || '未命名作战信息卡')}</h4>
                    <span class="text-xs px-2 py-0.5 rounded-md ${badgeColor} border font-medium">${typeName}</span>
                  </div>
                  <p class="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span><i class="fa-regular fa-clock mr-1 text-slate-400"></i>更新日期：${escapeHtml(item.updatedAt || '未知')}</span>
                    <span><i class="fa-solid fa-location-dot mr-1 text-slate-400"></i>${escapeHtml(item.address || '杭州萧山')}</span>
                  </p>
                </div>
              </div>
              <div class="flex items-center space-x-2 self-end sm:self-center">
                <button type="button" data-del-id="${item.id}" class="btn-del-project px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="删除记录">
                  <i class="fa-regular fa-trash-can"></i>
                </button>
                <button type="button" data-edit-type="${item.type}" data-edit-id="${item.id}" class="btn-open-edit px-4 py-2 rounded-xl text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm flex items-center space-x-1.5">
                  <i class="fa-regular fa-pen-to-square"></i>
                  <span>打开编辑</span>
                </button>
              </div>
            `;
            recentListEl.appendChild(row);
          });

          
          // 重新绑定打开编辑事件
          document.querySelectorAll('.btn-open-edit').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
              e.preventDefault();
              var type = this.getAttribute('data-edit-type') || 'village';
              var id = this.getAttribute('data-edit-id');
              if (window.AppRouter) {
                window.AppRouter.navigateTo('editor', { type: type, id: id });
              }
            });
          });

          // 重新绑定删除事件
          document.querySelectorAll('.btn-del-project').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
              e.preventDefault();
              const id = this.getAttribute('data-del-id');
              if (confirm('确定要删除该本地工程记录吗？')) {
                const filtered = projects.filter(p => p.id !== id);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
                loadSavedProjects();
              }
            });
          });

        } catch (e) {
          console.warn('读取本地工程异常:', e);
        }
      }

      function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, function (m) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
        });
      }

      // 2. 导入工程 JSON 文件
      const btnImport = document.getElementById('btn-import-project');
      const fileInput = document.getElementById('file-import-input');

      if (btnImport && fileInput) {
        btnImport.addEventListener('click', function () {
          fileInput.click();
        });

        fileInput.addEventListener('change', function (e) {
          const file = e.target.files && e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = function (event) {
            try {
              const data = JSON.parse(event.target.result);
              if (!data || !data.type) {
                alert('导入的文件不是有效的作战信息卡工程文件！');
                return;
              }
              // 存入当前激活草稿
              const importedId = 'import_' + Date.now();
              data.id = importedId;
              data.updatedAt = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });

              // 保存到总列表
              let list = [];
              try {
                list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
              } catch (err) {}
              list.unshift(data);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
              localStorage.setItem('fire_card_current_project', JSON.stringify(data));

              // 跳转至编辑器
              if (window.AppRouter) { window.AppRouter.navigateTo('editor', { type: data.type, id: importedId }); }
            } catch (err) {
              alert('解析工程文件失败，请确认文件格式为合法的JSON');
            }
          };
          reader.readAsText(file);
        });
      }

      // 3. 模态框打开与关闭
      const btnHelp = document.getElementById('btn-show-help');
      const modalHelp = document.getElementById('modal-help');
      const btnCloseHelp = document.getElementById('btn-close-help');
      const btnConfirmHelp = document.getElementById('btn-confirm-help');

      function toggleModal(show) {
        if (!modalHelp) return;
        if (show) {
          modalHelp.classList.remove('hidden');
        } else {
          modalHelp.classList.add('hidden');
        }
      }

      if (btnHelp) btnHelp.addEventListener('click', () => toggleModal(true));
      if (btnCloseHelp) btnCloseHelp.addEventListener('click', () => toggleModal(false));
      if (btnConfirmHelp) btnConfirmHelp.addEventListener('click', () => toggleModal(false));
      if (modalHelp) {
        modalHelp.addEventListener('click', function(e) {
          if (e.target === modalHelp) toggleModal(false);
        });
      }

      // 4. 卡片点击 Edge 兼容保障
      const cardVillage = document.getElementById('card-village');
      const cardBuilding = document.getElementById('card-building');

      if (cardVillage) {
        cardVillage.addEventListener('click', function(e) {
          // 标准链接自然跳转，无需阻止
        });
      }
      if (cardBuilding) {
        cardBuilding.addEventListener('click', function(e) {
          // 标准链接自然跳转
        });
      }

      // 5. 一键打包下载全部源码 ZIP
      const btnDownloadZip = document.getElementById('btn-download-source-zip');
      if (btnDownloadZip) {
        btnDownloadZip.addEventListener('click', async function () {
          const originalText = btnDownloadZip.innerHTML;
          try {
            btnDownloadZip.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-emerald-600 mr-1"></i><span>正在打包源码...</span>';
            btnDownloadZip.disabled = true;

            const zip = new JSZip();

            // 抓取当前单文件完整源代码
            const currentHtml = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
            zip.file('index.html', currentHtml);
            zip.file('单文件版_消防作战信息卡制作工具.html', currentHtml);

            // 附带一份清晰的说明文档 README.txt
            const readme = `================================================
【消防作战信息卡制作工具 - 独立纯静态前端网页源码包】
================================================

本系统为纯静态独立前端网页，无须安装 Node.js、后端数据库或服务器环境！
直接解压后，双击 index.html 即可在 Microsoft Edge、Google Chrome 等现代浏览器中完全离线或在线运行。

【文件清单】
1. index.html   - 首页：模板选择中心、规范说明、历史工程管理、导入工程
2. editor.html  - 编辑器：左表右图/总平面图两页 A4 标准排版、Leaflet 地图标绘、Fabric.js 标图、双页 PDF/PNG/DOCX 导出
3. README.txt   - 本使用说明

【核心特性】
- 纯前端技术栈：Tailwind CSS (CDN)、FontAwesome 6 (CDN)、Leaflet 1.9.4、Fabric.js、html2canvas、jsPDF、docx.js
- 完美契合实战标准：
  * 第 1 页：基本信息表单 + 战备水源图（消火栓、消防通道、水池码头、重点部位等）
  * 第 2 页：独立全幅总平面图，规范 A4 横向排版
- 多格式导出：
  * 导出双页 A4 PDF（精准 297mm x 210mm 打印格式）
  * 导出高清 PNG 图片（自动下载第1页与第2页）
  * 导出双页标准 Word (.docx) 文档
  * 导出/导入 JSON 备份工程，随时归档交接

祝灭火救援战斗训练与数字化预案制作顺利！
`;
            zip.file('README.txt', readme);

            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = '消防作战信息卡制作工具_前端源码包.zip';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          } catch (err) {
            console.error('打包源码失败:', err);
            alert('打包源码失败，您也可以在浏览器中右键另存为 index.html 和 editor.html！');
          } finally {
            btnDownloadZip.innerHTML = originalText;
            btnDownloadZip.disabled = false;
          }
        });
      }

      // 执行初始载入
      loadSavedProjects();

      // 导出给路由管理器使用
      window.IndexModule = {
        loadSavedProjects: loadSavedProjects
      };

    })();
  

(function () {
      'use strict';

      // 1. 获取 URL 参数识别模板类型 (village 或 building)
      const urlParams = new URLSearchParams(window.location.search);
      let currentTemplate = urlParams.get('type') || 'village';
      if (currentTemplate !== 'village' && currentTemplate !== 'building') {
        currentTemplate = 'village';
      }

      // 图名状态：默认【水源图】，可切换【总平面图】
      let currentMapHeaderTitle = '水 源 图';

      // UI 状态与工程数据模型 (默认对准杭州萧山进化镇城山村)
      const projectData = {
        id: urlParams.get('id') || 'project_' + Date.now(),
        type: currentTemplate,
        title: currentTemplate === 'village' ? '浙江省杭州市萧山区进化镇城山村作战信息卡' : '萧山区某重点单位作战信息卡',
        updatedAt: '2026/09/13',
        formValues: {},
        mapCenter: [29.9885, 120.2828], // 进化镇城山村真实坐标
        mapZoom: 16,
        plots: []
      };

      // 字段定义 (严格按照图1的标准 5 项排版)
      const villageFields = [
        { key: 'address', label: '地  址', type: 'text', placeholder: '如：浙江省杭州市萧山区进化镇城山村' },
        { key: 'phone', label: '电话号码', type: 'textarea', placeholder: '如：治保主任：18958156768\n派出所：0571-82453110' },
        { key: 'features', label: '建筑特点', type: 'textarea', placeholder: '如：城山村共有 895 户，该村沿浙赣铁路东侧不规则分布，少数砖木结构老房，大部分均为院落式自建房。' },
        { key: 'points', label: '重点事项', type: 'textarea', placeholder: '如：1. 该村浙赣铁路和杭京衢高速公路从村西贯穿。\n2. 该村已农业种植为主。\n3. 该村内已小微企业厂房，老旧民房联片区，蔬菜大棚联片区。' },
        { key: 'water', label: '室外水源', type: 'textarea', placeholder: '如：村里共有12处天然池塘水源，均可供手抬泵和消防车吸水见平面图\n1，该村共有7个市政消火栓，分别在建在下颜2个，杜家弄2个，郑塘孔3个，均可供消防车吸水。' }
      ];

      const buildingFields = [
        { key: 'unitName', label: '单  位', type: 'text', placeholder: '如：杭州中管通风材料有限公司 / 杭州城山制线厂' },
        { key: 'address', label: '地  址', type: 'text', placeholder: '如：浙江省杭州市萧山区进化镇城山村白曹线88号' },
        { key: 'phone', label: '电话号码', type: 'textarea', placeholder: '如：安全负责人：1385812XXXX\n消控室：0571-8245XXXX' },
        { key: 'features', label: '建筑特点', type: 'textarea', placeholder: '如：钢结构单层厂房/局部三层砖混，总建筑面积约12,000㎡，耐火等级二级。' },
        { key: 'facilities', label: '消防设施', type: 'textarea', placeholder: '如：室内消火栓12处，室外市政消火栓2处（DN150），配有干粉灭火器及灭火防护装备。' },
        { key: 'tactics', label: '处置要点', type: 'textarea', placeholder: '如：首要冷却保护西侧易燃物料中转仓，沿白曹线主干道占领市政水源，内攻注意排烟防毒。' }
      ];

      // 图1实战样本真实数据 (100% 还原用户图1文字)
      const standardVillageDemoData = {
        address: '浙江省杭州市萧山区进化镇城山村',
        phone: '治保主任：18958156768\n派出所：0571-82453110',
        features: '城山村共有 895 户，该村沿浙赣铁路东侧不规则分布，少数砖木结构老房，大部分均为院落式自建房。',
        points: '1. 该村浙赣铁路和杭京衢高速公路从村西贯穿。\n2. 该村已农业种植为主。\n3. 该村内已小微企业厂房，老旧民房联片区，蔬菜大棚联片区。',
        water: '村里共有12处天然池塘水源，均可供手抬泵和消防车吸水见平面图\n1，该村共有7个市政消火栓，分别在建在下颜2个，杜家弄2个，郑塘孔3个，均可供消防车吸水。'
      };

      const standardBuildingDemoData = {
        unitName: '杭州中管通风材料有限公司（城山厂区）',
        address: '浙江省杭州市萧山区进化镇城山村白曹线东段',
        phone: '厂区主管：13958006688\n进化派出所：0571-82453110',
        features: '占地面积约15,000㎡，钢结构连跨车间2栋，周边紧邻城山村自建房群与杜邵线。',
        facilities: '厂区配置室外地上式消火栓4座（DN300管网），室外消防水池一座（300m³）。',
        tactics: '先期出两支水枪控制外围飞火，利用白曹线东侧市政消火栓干线供水，严禁人员盲目登顶。'
      };

      // 2. 初始化渲染表单
      const tacticalFormEl = document.getElementById('tactical-form');
      const badgeTemplateType = document.getElementById('badge-template-type');
      const formTemplateDesc = document.getElementById('form-template-desc');
      const inputProjectTitle = document.getElementById('input-project-title');

      function renderFormFields() {
        tacticalFormEl.innerHTML = '';
        const fields = currentTemplate === 'village' ? villageFields : buildingFields;

        if (currentTemplate === 'village') {
          badgeTemplateType.className = 'text-xs px-2.5 py-1 rounded-lg font-bold bg-emerald-100 text-emerald-800 border border-emerald-200';
          badgeTemplateType.textContent = '村落作战卡';
          formTemplateDesc.textContent = '当前模式：村落作战信息卡 (严格对齐图1规范)';
        } else {
          badgeTemplateType.className = 'text-xs px-2.5 py-1 rounded-lg font-bold bg-amber-100 text-amber-800 border border-amber-200';
          badgeTemplateType.textContent = '单体建筑卡';
          formTemplateDesc.textContent = '当前模式：单体建筑作战信息卡';
        }

        fields.forEach(function (field) {
          const wrapper = document.createElement('div');
          wrapper.className = 'space-y-1';

          const label = document.createElement('label');
          label.className = 'block text-xs font-bold text-slate-800 flex items-center justify-between';
          label.innerHTML = `<span>${field.label}</span> <span class="text-[11px] font-normal text-slate-400">${field.type === 'textarea' ? '多行' : '单行'}</span>`;

          let input;
          if (field.type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = field.key === 'points' || field.key === 'water' ? 4 : 3;
            input.className = 'w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none transition-all resize-y leading-relaxed';
          } else {
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none transition-all';
          }
          input.name = field.key;
          input.id = 'field_' + field.key;
          input.placeholder = field.placeholder;
          input.value = projectData.formValues[field.key] || '';

          input.addEventListener('input', function () {
            projectData.formValues[field.key] = this.value;
          });

          wrapper.appendChild(label);
          wrapper.appendChild(input);
          tacticalFormEl.appendChild(wrapper);
        });
      }

      // 标题与模板切换
      inputProjectTitle.addEventListener('input', function () {
        projectData.title = this.value;
      });

      document.getElementById('btn-switch-template').addEventListener('click', function (e) {
        e.preventDefault();
        const targetType = currentTemplate === 'village' ? 'building' : 'village';
        if (confirm(`确定切换至【${targetType === 'village' ? '村落' : '单体建筑'}】作战信息卡模板吗？`)) {
          currentTemplate = targetType;
          projectData.type = targetType;
          projectData.title = targetType === 'village' ? '浙江省杭州市萧山区进化镇城山村作战信息卡' : '萧山区某重点单位作战信息卡';
          inputProjectTitle.value = projectData.title;
          projectData.formValues = targetType === 'village' ? { ...standardVillageDemoData } : { ...standardBuildingDemoData };
          renderFormFields();
          showToast(`已切换至${targetType === 'village' ? '村落' : '单体建筑'}模板`);
        }
      });

      // 载入城山村标准实战案例按钮
      document.getElementById('btn-load-standard-demo').addEventListener('click', function () {
        loadFullStandardDemo();
        showToast('已载入杭州萧山进化镇城山村完整实战图样！');
      });

      document.getElementById('btn-fill-demo').addEventListener('click', function () {
        loadFullStandardDemo();
        showToast('已重载城山村实战数据与标绘要素');
      });

      document.getElementById('btn-clear-form').addEventListener('click', function () {
        if (confirm('确定清空当前表单所有文字吗？')) {
          projectData.formValues = {};
          renderFormFields();
          showToast('表单内容已清空');
        }
      });

      // 3. 初始化 Leaflet 地图
      let map = null;
      let osmLayer = null;
      let satelliteLayer = null;
      let leafletLayersGroup = null;

      function initMap() {
        // 定位萧山区进化镇城山村
        map = L.map('map-container', {
          center: projectData.mapCenter,
          zoom: projectData.mapZoom,
          zoomControl: false
        });

        L.control.zoom({ position: 'topright' }).addTo(map);

        // 1. 电子地图底图
        osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        });

        // 2. 卫星遥感影像
        satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri',
          maxZoom: 18
        });

        osmLayer.addTo(map);
        leafletLayersGroup = L.layerGroup().addTo(map);

        const coordsDisplay = document.getElementById('map-coords-display');
        map.on('mousemove', function (e) {
          if (coordsDisplay) {
            coordsDisplay.textContent = `坐标：${e.latlng.lng.toFixed(5)}, ${e.latlng.lat.toFixed(5)} | 萧山进化镇城山村`;
          }
        });

        map.on('moveend', function () {
          projectData.mapCenter = [map.getCenter().lat, map.getCenter().lng];
          projectData.mapZoom = map.getZoom();
        });

        map.on('click', handleMapClick);
        map.on('dblclick', handleMapDblClick);
      }

      // 底图切换
      const btnLayerVector = document.getElementById('btn-layer-vector');
      const btnLayerSatellite = document.getElementById('btn-layer-satellite');

      btnLayerVector.addEventListener('click', function () {
        if (map.hasLayer(satelliteLayer)) map.removeLayer(satelliteLayer);
        if (!map.hasLayer(osmLayer)) map.addLayer(osmLayer);
        btnLayerVector.className = 'px-2.5 py-1 rounded-lg font-bold text-blue-700 bg-white shadow-xs transition-all';
        btnLayerSatellite.className = 'px-2.5 py-1 rounded-lg font-medium text-slate-600 hover:text-slate-900 transition-all';
        showToast('已切换至电子底图');
      });

      btnLayerSatellite.addEventListener('click', function () {
        if (map.hasLayer(osmLayer)) map.removeLayer(osmLayer);
        if (!map.hasLayer(satelliteLayer)) map.addLayer(satelliteLayer);
        btnLayerSatellite.className = 'px-2.5 py-1 rounded-lg font-bold text-blue-700 bg-white shadow-xs transition-all';
        btnLayerVector.className = 'px-2.5 py-1 rounded-lg font-medium text-slate-600 hover:text-slate-900 transition-all';
        showToast('已切换至高分辨率卫星影像');
      });

      // 复位城山村
      document.getElementById('btn-reset-view').addEventListener('click', function () {
        map.setView([29.9885, 120.2828], 16);
        showToast('已复位至进化镇城山村核心战术视口');
      });

      // 清空标绘
      document.getElementById('btn-clear-plots').addEventListener('click', function () {
        if (confirm('确定清空地图上已绘制的所有战术图元吗？')) {
          leafletLayersGroup.clearLayers();
          projectData.plots = [];
          selectPlot(null);
          updateLayerList();
          showToast('标绘图元已清空');
        }
      });

      // 搜索定位
      document.getElementById('input-map-search').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          const val = this.value.trim();
          if (!val) return;
          const locations = {
            '城山村': [29.9885, 120.2828],
            '城山': [29.9885, 120.2828],
            '进化镇': [29.9760, 120.2880],
            '进化': [29.9760, 120.2880],
            '萧山': [30.165, 120.265],
            '瓜沥': [30.183, 120.452],
            '临浦': [30.088, 120.245],
            '市心': [30.185, 120.268],
            '沪昆高速': [29.9920, 120.2780]
          };
          for (let name in locations) {
            if (val.includes(name) || name.includes(val)) {
              map.setView(locations[name], 16);
              showToast(`已定位至：${name}`);
              return;
            }
          }
          showToast('已在萧山区域搜索：' + val);
        }
      });

      // 4. 工具栏状态切换与标绘交互
      let activeTool = 'select';
      let selectedPlot = null;
      let tempPoints = [];
      let tempDrawLayer = null;

      const btnTools = document.querySelectorAll('.btn-tool');
      const topStatusIndicator = document.getElementById('top-status-indicator');
      const drawInstructionBar = document.getElementById('draw-instruction-bar');
      const drawInstructionText = document.getElementById('draw-instruction-text');
      const btnCancelDraw = document.getElementById('btn-cancel-draw');

      btnTools.forEach(btn => {
        btn.addEventListener('click', function () {
          const tool = this.getAttribute('data-tool');
          setActiveTool(tool);
        });
      });

      function setActiveTool(tool) {
        activeTool = tool;
        tempPoints = [];
        if (tempDrawLayer) {
          leafletLayersGroup.removeLayer(tempDrawLayer);
          tempDrawLayer = null;
        }

        btnTools.forEach(b => {
          if (b.getAttribute('data-tool') === tool) {
            b.classList.add('border-blue-600', 'bg-blue-50', 'text-blue-700', 'ring-2', 'ring-blue-400/30');
            b.classList.remove('border-slate-200');
          } else {
            b.classList.remove('border-blue-600', 'bg-blue-50', 'text-blue-700', 'ring-2', 'ring-blue-400/30');
            b.classList.add('border-slate-200');
          }
        });

        const fabricContainer = document.getElementById('fabric-overlay-container');
        if (tool === 'freehand') {
          fabricContainer.classList.add('active-draw');
          initFabricCanvas();
          topStatusIndicator.textContent = '当前状态：自由战术手绘涂鸦中';
          drawInstructionBar.classList.remove('hidden');
          drawInstructionText.innerHTML = '<i class="fa-solid fa-paintbrush mr-1"></i>在地图上方自由书写与标绘，完成后可切换回选择模式';
        } else {
          fabricContainer.classList.remove('active-draw');
          if (tool === 'select') {
            topStatusIndicator.textContent = '当前状态：地图浏览与选择模式 (点击任意图元修改)';
            drawInstructionBar.classList.add('hidden');
          } else if (tool === 'vehicle_entry') {
            topStatusIndicator.textContent = '当前状态：请在路口单击放置【车辆可进入】红色导向箭头';
            drawInstructionBar.classList.remove('hidden');
            drawInstructionText.innerHTML = '<i class="fa-solid fa-location-arrow text-red-600 mr-1"></i>点击村道入道路口，即可生成红字导向标牌';
          } else if (tool === 'hydrant') {
            topStatusIndicator.textContent = '当前状态：请在地图上点击放置【市政消火栓(DN300)】';
            drawInstructionBar.classList.remove('hidden');
            drawInstructionText.innerHTML = '<i class="fa-solid fa-fire-extinguisher text-red-600 mr-1"></i>点击道路沿线，生成红色立体现管网消火栓';
          } else if (tool === 'pond') {
            topStatusIndicator.textContent = '当前状态：请点击放置【天然池塘 / 水源】';
            drawInstructionBar.classList.remove('hidden');
            drawInstructionText.innerHTML = '<i class="fa-solid fa-droplet text-blue-500 mr-1"></i>在天然池塘或河流处单击放置蓝色水源标牌';
          } else if (tool === 'committee') {
            topStatusIndicator.textContent = '当前状态：请点击放置【村委会 / 重点指挥部】';
            drawInstructionBar.classList.remove('hidden');
            drawInstructionText.innerHTML = '<i class="fa-solid fa-star text-red-500 mr-1"></i>单击放置城山村村委五角星红徽';
          } else if (tool === 'school') {
            topStatusIndicator.textContent = '当前状态：请点击放置【文教 / 幼儿园】';
            drawInstructionBar.classList.remove('hidden');
            drawInstructionText.innerHTML = '<i class="fa-solid fa-school text-cyan-600 mr-1"></i>单击放置城山幼儿园等重点防护单位';
          } else if (tool === 'road_label') {
            topStatusIndicator.textContent = '当前状态：请点击放置【道路干线路牌】';
            drawInstructionBar.classList.remove('hidden');
            drawInstructionText.innerHTML = '<i class="fa-solid fa-road mr-1"></i>单击放置如白曹线、曹下线、沪昆高速路牌';
          } else if (tool === 'fire') {
            topStatusIndicator.textContent = '当前状态：请点击放置【着火点】';
            drawInstructionBar.classList.remove('hidden');
            drawInstructionText.innerHTML = '<i class="fa-solid fa-fire text-red-500 mr-1"></i>在发生火情民房或厂房处放置动态火苗';
          } else if (tool === 'route') {
            topStatusIndicator.textContent = '当前状态：绘制【进攻路线】(单击拐点，双击结束)';
            drawInstructionBar.classList.remove('hidden');
            drawInstructionText.innerHTML = '<i class="fa-solid fa-arrow-trend-up text-orange-500 mr-1"></i>沿道路连续拐点单击绘制进攻干线，双击结束';
          } else if (tool === 'polygon') {
            topStatusIndicator.textContent = '当前状态：绘制【河流水域 / 居民区】(单击拐点，双击闭合)';
            drawInstructionBar.classList.remove('hidden');
            drawInstructionText.innerHTML = '<i class="fa-solid fa-draw-polygon text-emerald-600 mr-1"></i>单击各角点绘制水系或居民区方块，双击闭合';
          }
        }
      }

      btnCancelDraw.addEventListener('click', function () {
        setActiveTool('select');
      });

      // 5. 地图点击标绘处理
      function handleMapClick(e) {
        if (activeTool === 'select' || activeTool === 'freehand') return;
        const latlng = e.latlng;

        if (['vehicle_entry', 'hydrant', 'pond', 'committee', 'school', 'road_label', 'fire'].includes(activeTool)) {
          createSpecialPlot(activeTool, latlng);
          setActiveTool('select');
        } else if (activeTool === 'route' || activeTool === 'polygon') {
          tempPoints.push([latlng.lat, latlng.lng]);
          updateTempDrawPreview();
        }
      }

      function handleMapDblClick(e) {
        if (activeTool === 'route') {
          L.DomEvent.stopPropagation(e);
          if (tempPoints.length >= 2) {
            createPolylinePlot('route', tempPoints);
          }
          setActiveTool('select');
        } else if (activeTool === 'polygon') {
          L.DomEvent.stopPropagation(e);
          if (tempPoints.length >= 3) {
            createPolygonPlot('polygon', tempPoints);
          }
          setActiveTool('select');
        }
      }

      function updateTempDrawPreview() {
        if (tempDrawLayer) {
          leafletLayersGroup.removeLayer(tempDrawLayer);
        }
        if (tempPoints.length === 0) return;

        if (activeTool === 'route') {
          tempDrawLayer = L.polyline(tempPoints, {
            color: '#ea580c',
            weight: 4,
            dashArray: '4, 8'
          }).addTo(leafletLayersGroup);
        } else if (activeTool === 'polygon') {
          tempDrawLayer = L.polygon(tempPoints, {
            color: '#0284c7',
            fillColor: '#38bdf8',
            fillOpacity: 0.4,
            weight: 2,
            dashArray: '4, 4'
          }).addTo(leafletLayersGroup);
        }
      }

      // 6. 创建图1和图2特色战术图元
      function createSpecialPlot(type, latlng, existingData) {
        const id = existingData ? existingData.id : 'plot_' + Date.now();
        let label = existingData ? existingData.label : '';
        let color = existingData ? existingData.color : '';
        let size = existingData ? existingData.size : 28;
        let opacity = existingData ? existingData.opacity : 1;
        let angle = existingData ? (existingData.angle || 0) : 0;
        let extra = existingData ? (existingData.extra || '') : '';

        let iconHtml = '';
        let defaultLabel = '';

        if (type === 'vehicle_entry') {
          // 对应图1与图2中醒目的“车辆可进入”红色箭头
          defaultLabel = '车辆可进入';
          label = label || defaultLabel;
          color = color || '#dc2626';
          iconHtml = `
            <div class="flex items-center space-x-1 whitespace-nowrap" style="transform: rotate(${angle}deg); transform-origin: center center;">
              <!-- 红色粗大三角导向箭头 -->
              <svg width="28" height="24" viewBox="0 0 28 24" fill="${color}">
                <path d="M0,4 L18,12 L0,20 L6,12 Z" />
              </svg>
              <span style="color: ${color}; font-size: 11px; font-weight: 900; background: rgba(255,255,255,0.95); padding: 1px 4px; border-radius: 3px; border: 1px solid ${color}; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">${label}</span>
            </div>
          `;
        } else if (type === 'hydrant') {
          // 对应图1中红色消火栓并标注DN300
          defaultLabel = 'DN300';
          label = label || defaultLabel;
          color = color || '#dc2626';
          iconHtml = `
            <div class="flex flex-col items-center">
              <!-- 红色立体消火栓造型 -->
              <div style="background-color: ${color}; width: ${size}px; height: ${size}px;" class="rounded-md border-2 border-white shadow-lg flex items-center justify-center text-white">
                <i class="fa-solid fa-fire-extinguisher text-xs"></i>
              </div>
              <span class="mt-0.5 px-1 py-0.2 bg-white text-red-700 font-black text-[10px] rounded border border-red-300 shadow-xs whitespace-nowrap">${label}</span>
            </div>
          `;
        } else if (type === 'pond') {
          // 对应图1中浅蓝水滴池塘，图2水源圆标
          defaultLabel = '池塘';
          label = label || defaultLabel;
          color = color || '#0284c7';
          iconHtml = `
            <div class="flex flex-col items-center">
              <div style="background-color: #e0f2fe; border-color: ${color};" class="w-7 h-7 rounded-full border-2 flex items-center justify-center shadow-md text-blue-600">
                <i class="fa-solid fa-droplet text-xs"></i>
              </div>
              <span class="mt-0.5 px-1.5 py-0.2 bg-white text-blue-700 font-bold text-[10px] rounded-full border border-blue-200 shadow-xs whitespace-nowrap">${label}</span>
            </div>
          `;
        } else if (type === 'committee') {
          // 城山村村委红星
          defaultLabel = '城山村村委';
          label = label || defaultLabel;
          color = color || '#dc2626';
          iconHtml = `
            <div class="flex flex-col items-center">
              <div class="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md border-2 border-white text-sm">
                <i class="fa-solid fa-star"></i>
              </div>
              <span class="mt-0.5 px-1.5 py-0.2 bg-white text-red-700 font-bold text-[10px] rounded border border-red-300 shadow-xs whitespace-nowrap">${label}</span>
            </div>
          `;
        } else if (type === 'school') {
          // 城山幼儿园文标
          defaultLabel = '城山幼儿园';
          label = label || defaultLabel;
          color = color || '#0891b2';
          iconHtml = `
            <div class="flex flex-col items-center">
              <div class="w-7 h-7 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-md border-2 border-white text-xs">
                文
              </div>
              <span class="mt-0.5 px-1.5 py-0.2 bg-white text-cyan-800 font-bold text-[10px] rounded border border-cyan-300 shadow-xs whitespace-nowrap">${label}</span>
            </div>
          `;
        } else if (type === 'road_label') {
          // 沪昆高速、白曹线、曹下线路牌
          defaultLabel = '白曹线';
          label = label || defaultLabel;
          color = color || '#1e293b';
          iconHtml = `
            <div class="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-slate-400 shadow-md whitespace-nowrap flex items-center space-x-1">
              <i class="fa-solid fa-road text-amber-400 text-[9px]"></i>
              <span>${label}</span>
            </div>
          `;
        } else if (type === 'fire') {
          defaultLabel = '着火点';
          label = label || defaultLabel;
          color = color || '#dc2626';
          iconHtml = `
            <div style="background-color: ${color}; width: ${size}px; height: ${size}px;" class="rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white fire-marker-pulse">
              <i class="fa-solid fa-fire text-xs"></i>
            </div>
            <div class="mt-0.5 bg-white text-red-700 px-1 py-0.2 rounded font-black text-[10px] border border-red-300 shadow-xs whitespace-nowrap">${label}</div>
          `;
        }

        const divIcon = L.divIcon({
          className: 'custom-tactical-div-icon',
          html: iconHtml,
          iconSize: [size + 40, size + 20],
          iconAnchor: [(size + 40) / 2, (size + 20) / 2]
        });

        const marker = L.marker([latlng.lat, latlng.lng], {
          icon: divIcon,
          draggable: true
        }).addTo(leafletLayersGroup);

        const plotObj = {
          id: id,
          type: type,
          latlng: [latlng.lat, latlng.lng],
          label: label,
          color: color,
          size: size,
          opacity: opacity,
          angle: angle,
          extra: extra,
          leafletLayer: marker
        };

        marker.on('click', function (ev) {
          L.DomEvent.stopPropagation(ev);
          selectPlot(plotObj);
        });

        marker.on('dragend', function () {
          const newPos = marker.getLatLng();
          plotObj.latlng = [newPos.lat, newPos.lng];
        });

        if (!existingData) {
          projectData.plots.push(plotObj);
          selectPlot(plotObj);
          updateLayerList();
          showToast(`已标绘：${plotObj.label}`);
        } else {
          plotObj.leafletLayer = marker;
          return plotObj;
        }
      }

      function createPolylinePlot(type, points, existingData) {
        const id = existingData ? existingData.id : 'plot_' + Date.now();
        const color = existingData ? existingData.color : '#ea580c';
        const weight = existingData ? existingData.size : 5;
        const opacity = existingData ? existingData.opacity : 0.85;
        const label = existingData ? existingData.label : '主力进攻路线';

        const polyline = L.polyline(points, {
          color: color,
          weight: weight,
          opacity: opacity,
          smoothFactor: 1
        }).addTo(leafletLayersGroup);

        polyline.bindTooltip(`➡️ ${label}`, { permanent: true, direction: 'center', className: 'text-xs font-bold text-orange-700 bg-white/95 px-1.5 py-0.5 rounded shadow border border-orange-200' });

        const plotObj = {
          id: id,
          type: type,
          points: points,
          label: label,
          color: color,
          size: weight,
          opacity: opacity,
          leafletLayer: polyline
        };

        polyline.on('click', function (ev) {
          L.DomEvent.stopPropagation(ev);
          selectPlot(plotObj);
        });

        if (!existingData) {
          projectData.plots.push(plotObj);
          selectPlot(plotObj);
          updateLayerList();
          showToast('已完成进攻路线绘制');
        } else {
          plotObj.leafletLayer = polyline;
          return plotObj;
        }
      }

      function createPolygonPlot(type, points, existingData) {
        const id = existingData ? existingData.id : 'plot_' + Date.now();
        const color = existingData ? existingData.color : '#0284c7';
        const weight = existingData ? existingData.size : 3;
        const opacity = existingData ? existingData.opacity : 0.4;
        const label = existingData ? existingData.label : '河流水域/居民区';

        const polygon = L.polygon(points, {
          color: color,
          fillColor: color,
          fillOpacity: opacity,
          weight: weight
        }).addTo(leafletLayersGroup);

        polygon.bindTooltip(`🌊 ${label}`, { permanent: true, direction: 'center', className: 'text-xs font-bold text-blue-800 bg-white/95 px-2 py-0.5 rounded shadow border border-blue-200' });

        const plotObj = {
          id: id,
          type: type,
          points: points,
          label: label,
          color: color,
          size: weight,
          opacity: opacity,
          leafletLayer: polygon
        };

        polygon.on('click', function (ev) {
          L.DomEvent.stopPropagation(ev);
          selectPlot(plotObj);
        });

        if (!existingData) {
          projectData.plots.push(plotObj);
          selectPlot(plotObj);
          updateLayerList();
          showToast('已完成水系/区域绘制');
        } else {
          plotObj.leafletLayer = polygon;
          return plotObj;
        }
      }

      // 7. 选中图元与属性控制台联动
      const propertiesContent = document.getElementById('properties-content');
      const propertiesEmpty = document.getElementById('properties-empty');
      const selectedElementBadge = document.getElementById('selected-element-badge');
      const propTextLabel = document.getElementById('prop-text-label');
      const propColorInput = document.getElementById('prop-color-input');
      const propSizeSlider = document.getElementById('prop-size-slider');
      const propSizeVal = document.getElementById('prop-size-val');

      const propRotationWrapper = document.getElementById('prop-rotation-wrapper');
      const propRotationSlider = document.getElementById('prop-rotation-slider');
      const propRotationVal = document.getElementById('prop-rotation-val');

      const propHydrantPipeWrapper = document.getElementById('prop-hydrant-pipe-wrapper');

      function selectPlot(plot) {
        selectedPlot = plot;
        if (!plot) {
          propertiesContent.classList.add('hidden');
          propertiesEmpty.classList.remove('hidden');
          selectedElementBadge.textContent = '未选中';
          return;
        }

        propertiesContent.classList.remove('hidden');
        propertiesEmpty.classList.add('hidden');
        selectedElementBadge.textContent = plot.type.toUpperCase();

        propTextLabel.value = plot.label || '';
        propColorInput.value = plot.color || '#dc2626';
        propSizeSlider.value = plot.size || 28;
        propSizeVal.textContent = (plot.size || 28) + 'px';

        // 车辆进入箭头专属角度控制
        if (plot.type === 'vehicle_entry') {
          propRotationWrapper.classList.remove('hidden');
          propRotationSlider.value = plot.angle || 0;
          propRotationVal.textContent = (plot.angle || 0) + '°';
        } else {
          propRotationWrapper.classList.add('hidden');
        }

        // 消火栓专属管径选择
        if (plot.type === 'hydrant') {
          propHydrantPipeWrapper.classList.remove('hidden');
        } else {
          propHydrantPipeWrapper.classList.add('hidden');
        }

        highlightLayerItem(plot.id);
      }

      // 属性变动监听
      propTextLabel.addEventListener('input', function () {
        if (!selectedPlot) return;
        selectedPlot.label = this.value;
        refreshPlotLayer(selectedPlot);
        updateLayerList();
      });

      propColorInput.addEventListener('input', function () {
        if (!selectedPlot) return;
        selectedPlot.color = this.value;
        refreshPlotLayer(selectedPlot);
        updateLayerList();
      });

      document.querySelectorAll('.btn-color-swatch').forEach(btn => {
        btn.addEventListener('click', function () {
          if (!selectedPlot) return;
          const color = this.getAttribute('data-color');
          selectedPlot.color = color;
          propColorInput.value = color;
          refreshPlotLayer(selectedPlot);
          updateLayerList();
        });
      });

      propSizeSlider.addEventListener('input', function () {
        if (!selectedPlot) return;
        selectedPlot.size = parseInt(this.value, 10);
        propSizeVal.textContent = this.value + 'px';
        refreshPlotLayer(selectedPlot);
      });

      // 导向箭头角度滑块
      propRotationSlider.addEventListener('input', function () {
        if (!selectedPlot) return;
        selectedPlot.angle = parseInt(this.value, 10);
        propRotationVal.textContent = this.value + '°';
        refreshPlotLayer(selectedPlot);
      });

      // 快捷角度按钮
      document.querySelectorAll('.btn-quick-angle').forEach(btn => {
        btn.addEventListener('click', function () {
          if (!selectedPlot) return;
          const deg = parseInt(this.getAttribute('data-angle'), 10);
          selectedPlot.angle = deg;
          propRotationSlider.value = deg;
          propRotationVal.textContent = deg + '°';
          refreshPlotLayer(selectedPlot);
        });
      });

      // 快捷管径按钮
      document.querySelectorAll('.btn-pipe-size').forEach(btn => {
        btn.addEventListener('click', function () {
          if (!selectedPlot) return;
          const pipe = this.getAttribute('data-pipe');
          selectedPlot.label = pipe;
          propTextLabel.value = pipe;
          refreshPlotLayer(selectedPlot);
          updateLayerList();
        });
      });

      // 删除标绘
      document.getElementById('btn-prop-delete').addEventListener('click', function () {
        if (!selectedPlot) return;
        if (confirm(`确定删除标绘【${selectedPlot.label}】吗？`)) {
          leafletLayersGroup.removeLayer(selectedPlot.leafletLayer);
          projectData.plots = projectData.plots.filter(p => p.id !== selectedPlot.id);
          selectPlot(null);
          updateLayerList();
          showToast('标绘已移除');
        }
      });

      function refreshPlotLayer(plot) {
        if (['vehicle_entry', 'hydrant', 'pond', 'committee', 'school', 'road_label', 'fire'].includes(plot.type)) {
          leafletLayersGroup.removeLayer(plot.leafletLayer);
          const newMarker = createSpecialPlot(plot.type, { lat: plot.latlng[0], lng: plot.latlng[1] }, plot);
          plot.leafletLayer = newMarker.leafletLayer;
        } else if (plot.type === 'route') {
          plot.leafletLayer.setStyle({ color: plot.color, weight: plot.size });
          plot.leafletLayer.setTooltipContent(`➡️ ${plot.label}`);
        } else if (plot.type === 'polygon') {
          plot.leafletLayer.setStyle({ color: plot.color, fillColor: plot.color });
          plot.leafletLayer.setTooltipContent(`🌊 ${plot.label}`);
        }
      }

      // 8. 图层列表更新与高亮
      function updateLayerList() {
        const listEl = document.getElementById('plot-layer-items');
        const countEl = document.getElementById('plot-layer-count');
        countEl.textContent = projectData.plots.length + ' 项';

        if (projectData.plots.length === 0) {
          listEl.innerHTML = '<div class="text-[11px] text-slate-400 text-center py-2">暂无已绘制标绘</div>';
          return;
        }

        listEl.innerHTML = '';
        projectData.plots.forEach((p, idx) => {
          const item = document.createElement('div');
          item.id = 'layer-item-' + p.id;
          item.className = 'flex items-center justify-between p-1.5 rounded-lg border border-slate-100 hover:bg-blue-50/60 cursor-pointer transition-all text-[11px]';
          if (selectedPlot && selectedPlot.id === p.id) {
            item.classList.add('bg-blue-50', 'border-blue-300', 'font-bold');
          }

          let icon = 'fa-location-dot';
          if (p.type === 'vehicle_entry') icon = 'fa-location-arrow text-red-600';
          else if (p.type === 'hydrant') icon = 'fa-fire-extinguisher text-red-600';
          else if (p.type === 'pond') icon = 'fa-droplet text-blue-500';
          else if (p.type === 'committee') icon = 'fa-star text-red-500';
          else if (p.type === 'school') icon = 'fa-school text-cyan-600';
          else if (p.type === 'fire') icon = 'fa-fire text-red-500';
          else if (p.type === 'route') icon = 'fa-arrow-trend-up text-orange-500';
          else if (p.type === 'polygon') icon = 'fa-draw-polygon text-blue-600';

          item.innerHTML = `
            <div class="flex items-center space-x-1.5 truncate">
              <i class="fa-solid ${icon} text-[10px]"></i>
              <span class="truncate">${p.label}</span>
            </div>
            <span class="text-[9px] text-slate-400 font-mono">#${idx + 1}</span>
          `;

          item.addEventListener('click', function () {
            selectPlot(p);
            if (p.latlng) {
              map.panTo(p.latlng);
            }
          });

          listEl.appendChild(item);
        });
      }

      function highlightLayerItem(id) {
        document.querySelectorAll('#plot-layer-items > div').forEach(el => {
          el.classList.remove('bg-blue-50', 'border-blue-300', 'font-bold');
        });
        const target = document.getElementById('layer-item-' + id);
        if (target) {
          target.classList.add('bg-blue-50', 'border-blue-300', 'font-bold');
        }
      }

      // 9. Fabric.js 自由标绘初始化
      let fabricCanvas = null;
      function initFabricCanvas() {
        if (fabricCanvas) return;
        const container = document.getElementById('map-container');
        const cEl = document.getElementById('fabric-canvas');
        cEl.width = container.clientWidth;
        cEl.height = container.clientHeight;

        fabricCanvas = new fabric.Canvas('fabric-canvas', {
          isDrawingMode: true
        });
        fabricCanvas.freeDrawingBrush.color = '#dc2626';
        fabricCanvas.freeDrawingBrush.width = 4;

        window.addEventListener('resize', () => {
          if (fabricCanvas) {
            fabricCanvas.setWidth(container.clientWidth);
            fabricCanvas.setHeight(container.clientHeight);
            fabricCanvas.renderAll();
          }
        });
      }

      // 10. 载入标准实战案例 (萧山区进化镇城山村全部预设)
      function loadFullStandardDemo() {
        currentTemplate = 'village';
        projectData.type = 'village';
        projectData.title = '浙江省杭州市萧山区进化镇城山村作战信息卡';
        inputProjectTitle.value = projectData.title;

        // 填充图1表单字段
        projectData.formValues = { ...standardVillageDemoData };
        renderFormFields();

        // 地图定位到进化镇城山村核心位置
        map.setView([29.9885, 120.2828], 16);

        // 清空已有标绘并注入城山村标准图元 (完美复现图1和图2)
        leafletLayersGroup.clearLayers();
        projectData.plots = [];

        // 1. 车辆可进入 (杜邵线、白曹线、曹下线路口)
        createSpecialPlot('vehicle_entry', { lat: 29.9898, lng: 120.2810 }, {
          id: 'plot_veh_1',
          type: 'vehicle_entry',
          label: '车辆可进入',
          color: '#dc2626',
          size: 28,
          angle: 120
        });

        createSpecialPlot('vehicle_entry', { lat: 29.9870, lng: 120.2845 }, {
          id: 'plot_veh_2',
          type: 'vehicle_entry',
          label: '车辆可进入',
          color: '#dc2626',
          size: 28,
          angle: 300
        });

        createSpecialPlot('vehicle_entry', { lat: 29.9910, lng: 120.2860 }, {
          id: 'plot_veh_3',
          type: 'vehicle_entry',
          label: '车辆可进入',
          color: '#dc2626',
          size: 28,
          angle: 210
        });

        // 2. 市政消火栓 DN300 (下颜2个、杜家弄2个、郑塘孔3个)
        createSpecialPlot('hydrant', { lat: 29.9892, lng: 120.2825 }, {
          id: 'plot_hyd_1',
          type: 'hydrant',
          label: 'DN300',
          color: '#dc2626',
          size: 28
        });

        createSpecialPlot('hydrant', { lat: 29.9880, lng: 120.2838 }, {
          id: 'plot_hyd_2',
          type: 'hydrant',
          label: 'DN300',
          color: '#dc2626',
          size: 28
        });

        createSpecialPlot('hydrant', { lat: 29.9872, lng: 120.2820 }, {
          id: 'plot_hyd_3',
          type: 'hydrant',
          label: 'DN300',
          color: '#dc2626',
          size: 28
        });

        createSpecialPlot('hydrant', { lat: 29.9902, lng: 120.2852 }, {
          id: 'plot_hyd_4',
          type: 'hydrant',
          label: 'DN300',
          color: '#dc2626',
          size: 28
        });

        // 3. 天然池塘 / 水源
        createSpecialPlot('pond', { lat: 29.9905, lng: 120.2818 }, {
          id: 'plot_pond_1',
          type: 'pond',
          label: '池塘',
          color: '#0284c7',
          size: 26
        });

        createSpecialPlot('pond', { lat: 29.9882, lng: 120.2805 }, {
          id: 'plot_pond_2',
          type: 'pond',
          label: '池塘',
          color: '#0284c7',
          size: 26
        });

        createSpecialPlot('pond', { lat: 29.9868, lng: 120.2830 }, {
          id: 'plot_pond_3',
          type: 'pond',
          label: '天然水源',
          color: '#0284c7',
          size: 26
        });

        // 4. 城山村村委
        createSpecialPlot('committee', { lat: 29.9888, lng: 120.2832 }, {
          id: 'plot_comm_1',
          type: 'committee',
          label: '城山村村委',
          color: '#dc2626',
          size: 32
        });

        // 5. 城山幼儿园
        createSpecialPlot('school', { lat: 29.9878, lng: 120.2850 }, {
          id: 'plot_school_1',
          type: 'school',
          label: '城山幼儿园',
          color: '#0891b2',
          size: 28
        });

        // 6. 干线路牌
        createSpecialPlot('road_label', { lat: 29.9918, lng: 120.2800 }, {
          id: 'plot_road_1',
          type: 'road_label',
          label: '沪昆高速',
          color: '#1e293b',
          size: 24
        });

        createSpecialPlot('road_label', { lat: 29.9883, lng: 120.2815 }, {
          id: 'plot_road_2',
          type: 'road_label',
          label: '白曹线',
          color: '#1e293b',
          size: 24
        });

        createSpecialPlot('road_label', { lat: 29.9895, lng: 120.2855 }, {
          id: 'plot_road_3',
          type: 'road_label',
          label: '曹下线',
          color: '#1e293b',
          size: 24
        });

        updateLayerList();
      }

      // 11. A4 成品预览模态框逻辑 (严格渲染图1大表格)
      // 11. A4 双页成品预览模态框逻辑 (第1页基本信息+水源图，第2页总平面图，均A4横向)
      const btnPreviewCard = document.getElementById('btn-preview-card');
      const modalPreview = document.getElementById('modal-preview');
      const btnClosePreview = document.getElementById('btn-close-preview');
      const cardPrintMapHeader = document.getElementById('card-print-map-header');
      const cardPrintTableRows = document.getElementById('card-print-table-rows');
      const cardPrintPage2Title = document.getElementById('card-print-page2-title');

      // 双页快速跳转与显示控制
      const btnViewAll = document.getElementById('btn-view-all-pages');
      const btnJumpP1 = document.getElementById('btn-jump-p1');
      const btnJumpP2 = document.getElementById('btn-jump-p2');
      const page1El = document.getElementById('print-page-1');
      const page2El = document.getElementById('print-page-2');

      function updatePageTabState(activeTab) {
        btnViewAll.className = activeTab === 'all' 
          ? 'px-2.5 py-1 rounded-lg font-bold bg-white text-blue-700 shadow-xs' 
          : 'px-2.5 py-1 rounded-lg font-medium text-slate-600 hover:text-slate-900';
        btnJumpP1.className = activeTab === 'p1' 
          ? 'px-2.5 py-1 rounded-lg font-bold bg-white text-blue-700 shadow-xs' 
          : 'px-2.5 py-1 rounded-lg font-medium text-slate-600 hover:text-slate-900';
        btnJumpP2.className = activeTab === 'p2' 
          ? 'px-2.5 py-1 rounded-lg font-bold bg-white text-blue-700 shadow-xs' 
          : 'px-2.5 py-1 rounded-lg font-medium text-slate-600 hover:text-slate-900';
      }

      if (btnViewAll) {
        btnViewAll.addEventListener('click', function () {
          updatePageTabState('all');
          page1El.classList.remove('hidden');
          page2El.classList.remove('hidden');
          page1El.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }

      if (btnJumpP1) {
        btnJumpP1.addEventListener('click', function () {
          updatePageTabState('p1');
          page1El.classList.remove('hidden');
          page1El.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }

      if (btnJumpP2) {
        btnJumpP2.addEventListener('click', function () {
          updatePageTabState('p2');
          page2El.classList.remove('hidden');
          page2El.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }

      // 一键美化开关
      let isBeautified = false;
      document.getElementById('btn-beautify-toggle').addEventListener('click', function () {
        isBeautified = !isBeautified;
        const tables = document.querySelectorAll('.fire-standard-table');
        if (isBeautified) {
          tables.forEach(t => t.style.borderColor = '#1e3a8a');
          this.classList.add('bg-emerald-600', 'text-white');
          this.classList.remove('bg-emerald-50', 'text-emerald-800');
          showToast('已开启一键美化排版 (加固深蓝护眼公文质感)');
        } else {
          tables.forEach(t => t.style.borderColor = '#000000');
          this.classList.remove('bg-emerald-600', 'text-white');
          this.classList.add('bg-emerald-50', 'text-emerald-800');
          showToast('已恢复经典黑实线公文制式');
        }
      });

      btnPreviewCard.addEventListener('click', function () {
        openPreviewModal();
      });

      btnClosePreview.addEventListener('click', function () {
        modalPreview.classList.add('hidden');
      });

      function openPreviewModal() {
        modalPreview.classList.remove('hidden');
        if (cardPrintMapHeader) cardPrintMapHeader.textContent = '水 源 图';
        if (cardPrintPage2Title) cardPrintPage2Title.textContent = `${projectData.title} · 总平面图`;

        // 第1页：根据模板字段渲染 5 行基本信息，右侧单元格 rowspan="5" 嵌入水源图
        cardPrintTableRows.innerHTML = '';
        const fields = currentTemplate === 'village' ? villageFields : buildingFields;

        fields.forEach((f, idx) => {
          const tr = document.createElement('tr');
          const val = projectData.formValues[f.key] || '（未填写）';

          if (idx === 0) {
            tr.innerHTML = `
              <td class="field-title-cell">${f.label}</td>
              <td class="field-content-cell">${val}</td>
              <td rowspan="${fields.length}" class="map-photo-cell">
                <div class="relative w-full h-full min-h-[580px] bg-slate-100 flex items-center justify-center border border-slate-300 overflow-hidden">
                  <img id="card-print-map-img" src="" alt="战备地图水源图标绘成果" class="w-full h-full object-cover" />
                  <div id="card-map-loading" class="absolute inset-0 bg-white/90 flex flex-col items-center justify-center text-xs text-slate-500 space-y-2">
                    <i class="fa-solid fa-spinner fa-spin text-2xl text-blue-600"></i>
                    <span class="font-bold">正在渲染第1页【水源图】快照...</span>
                  </div>
                </div>
              </td>
            `;
          } else {
            tr.innerHTML = `
              <td class="field-title-cell">${f.label}</td>
              <td class="field-content-cell">${val}</td>
            `;
          }

          cardPrintTableRows.appendChild(tr);
        });

        renderMapSnapshot();
      }

      function renderMapSnapshot(callback) {
        const loading1 = document.getElementById('card-map-loading');
        const img1 = document.getElementById('card-print-map-img');
        const loading2 = document.getElementById('card-page2-loading');
        const img2 = document.getElementById('card-print-page2-img');

        if (loading1) loading1.classList.remove('hidden');
        if (loading2) loading2.classList.remove('hidden');

        const mapEl = document.getElementById('map-container');
        html2canvas(mapEl, {
          useCORS: true,
          allowTaint: true,
          scale: 2, // 2x超高清画质
          logging: false
        }).then(canvas => {
          const dataUrl = canvas.toDataURL('image/png');
          if (img1) img1.src = dataUrl;
          if (img2) img2.src = dataUrl;
          if (loading1) loading1.classList.add('hidden');
          if (loading2) loading2.classList.add('hidden');
          if (typeof callback === 'function') callback(dataUrl);
        }).catch(err => {
          console.warn('地图快照抓取提示:', err);
          if (loading1) loading1.classList.add('hidden');
          if (loading2) loading2.classList.add('hidden');
          if (typeof callback === 'function') callback(null);
        });
      }

      // 12. 导出双页标准 PDF (每页均为严格 A4 横向 297mm x 210mm)
      document.getElementById('btn-quick-export-pdf').addEventListener('click', function () {
        openPreviewModal();
        setTimeout(exportPDF, 800);
      });

      document.getElementById('btn-export-pdf-final').addEventListener('click', exportPDF);

      async function exportPDF() {
        showToast('正在生成双页 A4 标准作战信息卡 PDF...');
        const p1 = document.getElementById('print-page-1');
        const p2 = document.getElementById('print-page-2');

        if (!p1 || !p2) {
          alert('预览容器未初始化，请重试');
          return;
        }

        // 确保两页均可见以供抓取
        p1.classList.remove('hidden');
        p2.classList.remove('hidden');

        try {
          const opts = {
            scale: 2.5,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff'
          };

          // 抓取第1页
          const canvas1 = await html2canvas(p1, opts);
          // 抓取第2页
          const canvas2 = await html2canvas(p2, opts);

          const { jsPDF } = window.jspdf;
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
          });

          const pdfWidth = 297;
          const pdfHeight = 210;
          const margin = 8;
          const contentWidth = pdfWidth - margin * 2;

          // 第1页写入 (基本信息 + 水源图)
          const imgData1 = canvas1.toDataURL('image/jpeg', 0.98);
          const contentHeight1 = (canvas1.height * contentWidth) / canvas1.width;
          const offsetY1 = Math.max(margin, (pdfHeight - contentHeight1) / 2);
          pdf.addImage(imgData1, 'JPEG', margin, offsetY1, contentWidth, contentHeight1);

          // 添加第2页 (单独的总平面图)
          pdf.addPage('a4', 'landscape');
          const imgData2 = canvas2.toDataURL('image/jpeg', 0.98);
          const contentHeight2 = (canvas2.height * contentWidth) / canvas2.width;
          const offsetY2 = Math.max(margin, (pdfHeight - contentHeight2) / 2);
          pdf.addImage(imgData2, 'JPEG', margin, offsetY2, contentWidth, contentHeight2);

          pdf.save(`消防作战信息卡(双页标准)_${projectData.title}.pdf`);
          showToast('双页 A4 作战信息卡 PDF 已成功生成并下载！');
        } catch (err) {
          console.error('导出PDF失败:', err);
          alert('导出PDF失败，请重试！');
        }
      }

      // 13. 导出 PNG 高清大图 (同时下载第1页与第2页)
      document.getElementById('btn-export-png').addEventListener('click', async function () {
        showToast('正在生成双页高清PNG图片...');
        const p1 = document.getElementById('print-page-1');
        const p2 = document.getElementById('print-page-2');

        const opts = {
          scale: 2.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        };

        try {
          const canvas1 = await html2canvas(p1, opts);
          const imgData1 = canvas1.toDataURL('image/png');
          const dl1 = document.createElement('a');
          dl1.href = imgData1;
          dl1.download = `消防作战信息卡_第1页_基本信息与水源图_${projectData.title}.png`;
          document.body.appendChild(dl1);
          dl1.click();
          dl1.remove();

          // 稍作延迟下载第二页
          setTimeout(async () => {
            const canvas2 = await html2canvas(p2, opts);
            const imgData2 = canvas2.toDataURL('image/png');
            const dl2 = document.createElement('a');
            dl2.href = imgData2;
            dl2.download = `消防作战信息卡_第2页_总平面图_${projectData.title}.png`;
            document.body.appendChild(dl2);
            dl2.click();
            dl2.remove();
            showToast('第1页与第2页高清PNG均已下载完成！');
          }, 400);
        } catch (e) {
          console.error(e);
          showToast('PNG导出出错，请重试');
        }
      });

      // 14. 导出 Word (.docx) 文档 (包含第1页基本信息+水源图，以及第2页单独总平面图)
      document.getElementById('btn-export-docx').addEventListener('click', function () {
        if (!window.docx) {
          alert('Word导出库正在载入，请稍等重试！');
          return;
        }

        showToast('正在导出标准双页 Word (.docx) 文档...');

        const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } = window.docx;
        const fields = currentTemplate === 'village' ? villageFields : buildingFields;

        // 表头：左侧 基本信息，右侧 水源图
        const tableRows1 = [
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 2,
                width: { size: 45, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    text: '基 本 信 息',
                    alignment: AlignmentType.CENTER,
                    style: { bold: true }
                  })
                ]
              }),
              new TableCell({
                width: { size: 55, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    text: '水 源 图',
                    alignment: AlignmentType.CENTER,
                    style: { bold: true }
                  })
                ]
              })
            ]
          })
        ];

        // 5行数据，右侧第1行跨5行合并
        fields.forEach((f, idx) => {
          const val = projectData.formValues[f.key] || '（未填写）';

          if (idx === 0) {
            tableRows1.push(
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 12, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: f.label, bold: true })] })]
                  }),
                  new TableCell({
                    width: { size: 33, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: val })]
                  }),
                  new TableCell({
                    width: { size: 55, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        text: '【水源图附战备标绘要素】',
                        alignment: AlignmentType.CENTER
                      }),
                      new Paragraph({
                        text: '重点标绘要素：消火栓DN300共7处、车辆可通行道路3条、天然池塘水源12处、周边重点单位等。',
                        alignment: AlignmentType.CENTER
                      })
                    ]
                  })
                ]
              })
            );
          } else {
            tableRows1.push(
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 12, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: f.label, bold: true })] })]
                  }),
                  new TableCell({
                    width: { size: 33, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: val })]
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: '' })]
                  })
                ]
              })
            );
          }
        });

        // 第2页：单独总平面图表格
        const tableRows2 = [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 100, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    text: '总 平 面 图',
                    alignment: AlignmentType.CENTER,
                    style: { bold: true }
                  })
                ]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                width: { size: 100, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    text: `【${projectData.title} · 总平面图标绘成果图】`,
                    alignment: AlignmentType.CENTER
                  }),
                  new Paragraph({
                    text: '包含完整建筑轮廓、防火分区、主干道路、避难场所及周边地理空间态势。',
                    alignment: AlignmentType.CENTER
                  })
                ]
              })
            ]
          })
        ];

        const doc = new Document({
          sections: [
            // Section 1: 第1页 基本信息 + 水源图 (A4横向)
            {
              properties: {
                page: {
                  size: { orientation: 'landscape' }
                }
              },
              children: [
                new Paragraph({
                  text: `${projectData.title} (第1页 · 基本信息与水源图)`,
                  heading: HeadingLevel.HEADING_1,
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 200 }
                }),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: tableRows1
                }),
                new Paragraph({
                  text: '制卡单位：杭州市消防救援支队萧山区大队    核准：战训科',
                  alignment: AlignmentType.RIGHT,
                  spacing: { before: 200 }
                })
              ]
            },
            // Section 2: 第2页 单独总平面图 (A4横向)
            {
              properties: {
                page: {
                  size: { orientation: 'landscape' }
                }
              },
              children: [
                new Paragraph({
                  text: `${projectData.title} (第2页 · 单独总平面图)`,
                  heading: HeadingLevel.HEADING_1,
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 200 }
                }),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: tableRows2
                }),
                new Paragraph({
                  text: '制卡单位：杭州市消防救援支队萧山区大队    核准：战训科',
                  alignment: AlignmentType.RIGHT,
                  spacing: { before: 200 }
                })
              ]
            }
          ]
        });

        Packer.toBlob(doc).then(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `消防作战信息卡_${projectData.title}.docx`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          showToast('Word文档已成功生成并下载！');
        }).catch(err => {
          console.error('Word生成错误:', err);
          alert('生成Word失败，请重试！');
        });
      });

      // 15. 系统打印
      document.getElementById('btn-trigger-print').addEventListener('click', function () {
        window.print();
      });

      // 16. JSON 备份工程导入与导出
      document.getElementById('btn-export-json').addEventListener('click', function () {
        const json = JSON.stringify(projectData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `消防作战卡备份_${projectData.title}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast('工程备份 JSON 已导出');
      });

      // 打包下载全部网页源码 ZIP
      const btnEditorZip = document.getElementById('btn-editor-download-zip');
      if (btnEditorZip) {
        btnEditorZip.addEventListener('click', async function () {
          const originalText = btnEditorZip.innerHTML;
          try {
            btnEditorZip.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>打包中...';
            btnEditorZip.disabled = true;

            const zip = new JSZip();
            const currentHtml = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
            zip.file('index.html', currentHtml);
            zip.file('单文件版_消防作战信息卡制作工具.html', currentHtml);
            zip.file('当前工程备份.json', JSON.stringify(projectData, null, 2));

            const readme = `【消防作战信息卡制作工具 - 独立纯静态前端网页源码包】\n\n直接解压后，双击 index.html 即可在 Edge 或 Chrome 浏览器中运行！\n包含:\n1. index.html - 首页模板选择\n2. editor.html - 作战信息卡编辑器\n3. 当前工程备份.json - 当前正在编辑的作战卡数据`;
            zip.file('README.txt', readme);

            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `消防作战信息卡制作工具_前端源码包.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            showToast('全部源码 ZIP 已成功打包并开始下载！');
          } catch (err) {
            console.error(err);
            alert('打包源码失败，请检查网络或直接在首页下载');
          } finally {
            btnEditorZip.innerHTML = originalText;
            btnEditorZip.disabled = false;
          }
        });
      }

      document.getElementById('btn-import-json').addEventListener('click', function () {
        document.getElementById('input-file-import').click();
      });

      document.getElementById('input-file-import').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (evt) {
          try {
            const data = JSON.parse(evt.target.result);
            loadProjectFromObject(data);
            showToast('工程文件导入成功！');
          } catch (err) {
            alert('JSON 文件解析失败，请检查文件格式！');
          }
        };
        reader.readAsText(file);
      });

      // 保存到本地 LocalStorage
      document.getElementById('btn-save-project').addEventListener('click', function () {
        try {
          projectData.updatedAt = new Date().toLocaleDateString('zh-CN');
          localStorage.setItem('fire_card_current_project', JSON.stringify(projectData));
          
          let list = [];
          try {
            list = JSON.parse(localStorage.getItem('fire_tactical_card_projects') || '[]');
          } catch (e) {}

          const existingIndex = list.findIndex(p => p.id === projectData.id);
          if (existingIndex >= 0) {
            list[existingIndex] = { ...projectData, leafletLayer: undefined };
          } else {
            list.unshift({ ...projectData, leafletLayer: undefined });
          }
          localStorage.setItem('fire_tactical_card_projects', JSON.stringify(list));

          document.getElementById('form-saved-time').textContent = '已保存 ' + new Date().toLocaleTimeString();
          showToast('工程已成功保存至本地！');
        } catch (e) {
          showToast('保存成功');
        }
      });

      function loadProjectFromObject(obj) {
        if (!obj) return;
        projectData.id = obj.id || projectData.id;
        projectData.type = obj.type || currentTemplate;
        projectData.title = obj.title || projectData.title;
        projectData.formValues = obj.formValues || {};
        projectData.mapCenter = obj.mapCenter || [29.9885, 120.2828];
        projectData.mapZoom = obj.mapZoom || 16;

        currentTemplate = projectData.type;
        inputProjectTitle.value = projectData.title;
        renderFormFields();

        map.setView(projectData.mapCenter, projectData.mapZoom);
        leafletLayersGroup.clearLayers();
        projectData.plots = [];

        if (obj.plots && Array.isArray(obj.plots)) {
          obj.plots.forEach(p => {
            if (['vehicle_entry', 'hydrant', 'pond', 'committee', 'school', 'road_label', 'fire'].includes(p.type)) {
              createSpecialPlot(p.type, { lat: p.latlng[0], lng: p.latlng[1] }, p);
            } else if (p.type === 'route') {
              createPolylinePlot('route', p.points, p);
            } else if (p.type === 'polygon') {
              createPolygonPlot('polygon', p.points, p);
            }
          });
        }
        updateLayerList();
      }

      // 17. 吐司提示
      const toastEl = document.getElementById('toast');
      const toastMsgEl = document.getElementById('toast-msg');
      let toastTimer = null;

      function showToast(msg) {
        if (!toastEl) return;
        toastMsgEl.textContent = msg;
        toastEl.classList.remove('translate-y-12', 'opacity-0', 'pointer-events-none');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
          toastEl.classList.add('translate-y-12', 'opacity-0', 'pointer-events-none');
        }, 2500);
      }

      // 18. 启动引导
      function boot() {
        renderFormFields();
        initMap();

        // 默认载入城山村标准实战案例 (图1 100% 对齐)
        loadFullStandardDemo();
      }

      
      window.EditorModule = {
        boot: function(params) {
          if (params && params.type) {
            currentTemplate = params.type;
            projectData.type = params.type;
          }
          if (params && params.id) {
            // 尝试从 localStorage 寻找对应工程
            try {
              const list = JSON.parse(localStorage.getItem('fire_tactical_card_projects') || '[]');
              const found = list.find(p => p.id === params.id);
              if (found) {
                renderFormFields();
                initMap();
                loadProjectFromObject(found);
                return;
              }
            } catch(e) {}
          }
          boot();
        },
        switchOrLoad: function(params) {
          if (!params) return;
          if (params.id) {
            try {
              const list = JSON.parse(localStorage.getItem('fire_tactical_card_projects') || '[]');
              const found = list.find(p => p.id === params.id);
              if (found) {
                loadProjectFromObject(found);
                return;
              }
            } catch(e) {}
          }
          if (params.type && params.type !== currentTemplate) {
            currentTemplate = params.type;
            projectData.type = params.type;
            projectData.title = params.type === 'village' ? '浙江省杭州市萧山区进化镇城山村作战信息卡' : '萧山区某重点单位作战信息卡';
            inputProjectTitle.value = projectData.title;
            projectData.formValues = params.type === 'village' ? { ...standardVillageDemoData } : { ...standardBuildingDemoData };
            renderFormFields();
            if (params.type === 'village') {
              loadFullStandardDemo();
            } else {
              leafletLayersGroup.clearLayers();
              projectData.plots = [];
              updateLayerList();
            }
          }
        },
        invalidateMapSize: function() {
          if (map) {
            map.invalidateSize();
          }
          if (fabricCanvas) {
            const container = document.getElementById('map-container');
            if (container) {
              fabricCanvas.setWidth(container.clientWidth);
              fabricCanvas.setHeight(container.clientHeight);
              fabricCanvas.renderAll();
            }
          }
        },
        loadProject: loadProjectFromObject
      };


    })();
  

// 消防作战信息卡制作系统 - 单HTML视图路由器与桥接管理器
window.AppRouter = {
  currentView: 'home',
  editorInitialized: false,

  init: function() {
    // 绑定返回首页按钮
    const btnBack = document.getElementById('btn-back-to-home');
    if (btnBack) {
      btnBack.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo('home');
      });
    }

    // 绑定首页模板新建卡片
    const cardVillage = document.getElementById('card-village');
    if (cardVillage) {
      cardVillage.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo('editor', { type: 'village' });
      });
    }

    const cardBuilding = document.getElementById('card-building');
    if (cardBuilding) {
      cardBuilding.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo('editor', { type: 'building' });
      });
    }

    // 监听 URL hash 变化以支持浏览器前进后退或书签
    window.addEventListener('hashchange', () => {
      this.handleHashRoute();
    });

    // 初始路由解析
    this.handleHashRoute();
  },

  handleHashRoute: function() {
    const hash = window.location.hash || '';
    if (hash.startsWith('#editor')) {
      const queryStr = hash.includes('?') ? hash.split('?')[1] : '';
      const params = new URLSearchParams(queryStr);
      const type = params.get('type') || 'village';
      const id = params.get('id') || null;
      this.navigateTo('editor', { type, id }, false);
    } else {
      this.navigateTo('home', {}, false);
    }
  },

  navigateTo: function(viewName, params = {}, updateHash = true) {
    this.currentView = viewName;
    const viewHome = document.getElementById('view-home');
    const viewEditor = document.getElementById('view-editor');

    if (viewName === 'home') {
      if (updateHash) {
        window.location.hash = '#home';
      }
      if (viewHome) viewHome.classList.remove('hidden');
      if (viewEditor) viewEditor.classList.add('hidden');
      document.body.classList.remove('h-screen', 'overflow-hidden', 'editor-mode');
      document.body.classList.add('min-h-screen');

      // 刷新首页工程列表
      if (window.IndexModule && typeof window.IndexModule.loadSavedProjects === 'function') {
        window.IndexModule.loadSavedProjects();
      }
    } else if (viewName === 'editor') {
      if (updateHash) {
        let hashStr = '#editor';
        const q = [];
        if (params.type) q.push('type=' + encodeURIComponent(params.type));
        if (params.id) q.push('id=' + encodeURIComponent(params.id));
        if (q.length > 0) hashStr += '?' + q.join('&');
        window.location.hash = hashStr;
      }
      if (viewHome) viewHome.classList.add('hidden');
      if (viewEditor) viewEditor.classList.remove('hidden');
      document.body.classList.remove('min-h-screen');
      document.body.classList.add('h-screen', 'overflow-hidden', 'editor-mode');

      // 首次载入或重载编辑器
      if (!this.editorInitialized) {
        if (window.EditorModule && typeof window.EditorModule.boot === 'function') {
          window.EditorModule.boot(params);
        }
        this.editorInitialized = true;
      } else {
        if (window.EditorModule && typeof window.EditorModule.switchOrLoad === 'function') {
          window.EditorModule.switchOrLoad(params);
        }
      }

      // 地图尺寸重算
      setTimeout(() => {
        if (window.EditorModule && window.EditorModule.invalidateMapSize) {
          window.EditorModule.invalidateMapSize();
        }
      }, 100);
    }
  }
};


  // 绑定首页默认卡片上的 "打开编辑" 按钮
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-nav-template]').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.preventDefault();
        var t = this.getAttribute('data-nav-template') || 'village';
        if (window.AppRouter) {
          window.AppRouter.navigateTo('editor', { type: t });
        }
      });
    });

    // 启动 SPA 路由
    if (window.AppRouter) {
      window.AppRouter.init();
    }
  });
  