import { useEffect, useState, type CSSProperties } from "react";
import { Button, Flex, Form, Image, Input, message, Modal, Space, Select, Table, Tag, Tooltip, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile, UploadProps } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  FileOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useTitle } from "@evanpatchouli/react-hooks-kit";
import * as CineAPI from "@/api/cine.api";
import type { PaginatedResult } from "@cine-stream/common";

type EpisodeDraft = CineAPI.EpisodeInput & { key: string };

const emptyPage: PaginatedResult<CineAPI.CineRecord> = {
  list: [],
  total: 0,
  page: 1,
  size: 10,
  totalPages: 1,
};

function createEpisodeDraft(): EpisodeDraft {
  return {
    key: crypto.randomUUID(),
    name: "",
    description: "",
    duration: "",
    thumbnail: "",
    file_path: "",
    file_url: "",
  };
}

interface CineFormValues {
  name: string;
  description?: string;
  genre?: string[];
  year?: string;
  season?: string;
  rating?: string;
  poster?: string;
  backdrop?: string;
  badge?: string;
  meta?: string;
  castText?: string;
}

function formatCast(cast?: string[]) {
  return cast?.join("\n") || "";
}

function toCinePayload(values: CineFormValues) {
  const { castText, ...rest } = values;
  const cast = (castText || "")
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return { ...rest, cast };
}

function ImageUploadInput({ value, onChange }: { value?: string; onChange?: (value: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const fileList: UploadFile[] = value
    ? [
        {
          uid: value,
          name: "image",
          status: "done",
          url: value,
        },
      ]
    : [];

  const beforeUpload: UploadProps["beforeUpload"] = async (file) => {
    if (!file.type.startsWith("image/")) {
      message.error("请选择图片文件");
      return Upload.LIST_IGNORE;
    }

    setUploading(true);
    try {
      const resp = await CineAPI.uploadCineImage(file as File);
      const data = resp.getData();
      if (data?.url) {
        onChange?.(data.url);
        message.success("图片上传成功");
      }
    } catch {
      return Upload.LIST_IGNORE;
    } finally {
      setUploading(false);
    }

    return Upload.LIST_IGNORE;
  };

  const handlePreview: UploadProps["onPreview"] = async (file) => {
    const imageUrl = file.url || value || "";
    if (!imageUrl) {
      message.warning("暂无可预览图片");
      return;
    }
    setPreviewImage(imageUrl);
    setPreviewOpen(true);
  };

  return (
    <div className="cine-image-upload">
      <style>
        {`
          .cine-image-upload .ant-upload-wrapper,
          .cine-image-upload .ant-upload-list,
          .cine-image-upload .ant-upload-list-item-container,
          .cine-image-upload .ant-upload.ant-upload-select {
            width: 100% !important;
          }
          .cine-image-upload .ant-upload-list-item-container,
          .cine-image-upload .ant-upload.ant-upload-select {
            height: 116px !important;
          }
          .cine-image-upload .ant-upload-list-item {
            padding: 0 !important;
            overflow: hidden;
            border-radius: 8px !important;
          }
          .cine-image-upload .ant-upload-list-item-image {
            object-fit: cover !important;
          }
        `}
      </style>
      <Upload
        accept="image/*"
        beforeUpload={beforeUpload}
        fileList={fileList}
        listType="picture-card"
        maxCount={1}
        onPreview={handlePreview}
        onRemove={() => {
          onChange?.("");
          return false;
        }}
        showUploadList={{
          showPreviewIcon: true,
          showRemoveIcon: true,
          showDownloadIcon: false,
        }}
      >
        {fileList.length ? null : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
            }}
          >
            <Space orientation="vertical" size={6} align="center">
              <UploadOutlined style={{ color: "#1677ff", fontSize: 20 }} />
              <span style={{ color: "#4b5563" }}>{uploading ? "上传中..." : "选择图片上传"}</span>
            </Space>
          </div>
        )}
      </Upload>
      {previewImage ? (
        <Image
          preview={{
            visible: previewOpen,
            src: previewImage,
            onVisibleChange: (visible) => setPreviewOpen(visible),
          }}
          src={previewImage}
          style={{ display: "none" }}
        />
      ) : null}
    </div>
  );
}

export default function CineManageView() {
  useTitle("影视管理 - CineStream");
  const [form] = Form.useForm();
  const [queryForm] = Form.useForm();
  const [cinePage, setCinePage] = useState(emptyPage);
  const [query, setQuery] = useState({ page: 1, size: 10, keyword: "" });
  const [editing, setEditing] = useState<CineAPI.CineRecord | null>(null);
  const [cineModalOpen, setCineModalOpen] = useState(false);
  const [episodeModalOpen, setEpisodeModalOpen] = useState(false);
  const [currentCine, setCurrentCine] = useState<CineAPI.CineRecord | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeDraft[]>([]);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [fileTargetIndex, setFileTargetIndex] = useState<number | null>(null);
  const [thumbnailRefreshingIndex, setThumbnailRefreshingIndex] = useState<number | null>(null);
  const [rootModalOpen, setRootModalOpen] = useState(false);
  const [rootForm] = Form.useForm();
  const [mediaRoot, setMediaRoot] = useState<CineAPI.MediaRootSetting | null>(null);
  const [mediaState, setMediaState] = useState<{
    root: string;
    configured_root: string;
    current: string;
    items: CineAPI.MediaFileItem[];
  }>({ root: "", configured_root: "", current: "", items: [] });

  const loadData = async (next = query) => {
    const resp = await CineAPI.queryCinePage(next);
    setCinePage(resp.getData() || emptyPage);
  };

  const openCreateModal = () => {
    setEditing(null);
    form.resetFields();
    setCineModalOpen(true);
  };

  const openEditModal = (record: CineAPI.CineRecord) => {
    setEditing(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      genre: record.genre,
      year: record.year,
      season: record.season,
      rating: record.rating,
      poster: record.poster,
      backdrop: record.backdrop,
      badge: record.badge,
      meta: record.meta,
      castText: formatCast(record.cast),
    });
    setCineModalOpen(true);
  };

  const saveCine = async () => {
    const values = await form.validateFields();
    const payload = toCinePayload(values);
    if (editing) {
      await CineAPI.updateCine(editing.id, payload);
      message.success("影视更新成功");
    } else {
      await CineAPI.createCine(payload);
      message.success("影视创建成功");
    }
    setCineModalOpen(false);
    loadData();
  };

  const openEpisodeModal = (record: CineAPI.CineRecord) => {
    setCurrentCine(record);
    setEpisodes(
      record.episodes?.length
        ? record.episodes.map((episode) => ({
            key: episode.id || crypto.randomUUID(),
            name: episode.name,
            description: episode.description || "",
            duration: episode.duration || "",
            thumbnail: episode.thumbnail || "",
            file_path: episode.file_path,
            file_url: episode.file_url || "",
          }))
        : [],
    );
    setEpisodeModalOpen(true);
  };

  const updateEpisode = (index: number, patch: Partial<EpisodeDraft>) => {
    setEpisodes((prev) => prev.map((episode, i) => (i === index ? { ...episode, ...patch } : episode)));
  };

  const moveEpisode = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= episodes.length) {
      return;
    }
    const next = [...episodes];
    [next[index], next[target]] = [next[target], next[index]];
    setEpisodes(next);
  };

  const saveEpisodes = async () => {
    if (!currentCine) {
      return;
    }
    const invalid = episodes.some((episode) => !episode.name.trim() || !episode.file_path.trim());
    if (invalid) {
      message.error("每集都必须填写名称并选择视频文件");
      return;
    }
    await CineAPI.replaceEpisodes(
      currentCine.id,
      episodes.map(({ key, duration, ...episode }) => episode),
    );
    message.success("剧集配置已保存");
    setEpisodeModalOpen(false);
    loadData();
  };

  const loadMediaFiles = async (dir = "") => {
    const resp = await CineAPI.listMediaFiles(dir);
    setMediaState(
      resp.getData() || {
        root: "",
        configured_root: "",
        current: "",
        items: [],
      },
    );
  };

  const loadMediaRoot = async () => {
    const resp = await CineAPI.getMediaRoot();
    const data = resp.getData();
    if (data) {
      setMediaRoot(data);
      rootForm.setFieldsValue({ root: data.configured_root });
    }
    return data;
  };

  const openRootModal = async () => {
    await loadMediaRoot();
    setRootModalOpen(true);
  };

  const saveMediaRoot = async () => {
    const values = await rootForm.validateFields();
    const resp = await CineAPI.updateMediaRoot(values.root);
    const data = resp.getData();
    if (data) {
      setMediaRoot(data);
      rootForm.setFieldsValue({ root: data.configured_root });
    }
    message.success("资源目录已更新");
    setRootModalOpen(false);
    if (fileModalOpen) {
      loadMediaFiles();
    }
  };

  const openFileSelector = (index: number) => {
    setFileTargetIndex(index);
    setFileModalOpen(true);
    loadMediaRoot();
    loadMediaFiles();
  };

  const chooseFile = async (item: CineAPI.MediaFileItem) => {
    if (item.type === "directory") {
      loadMediaFiles(item.relative_path);
      return;
    }
    if (fileTargetIndex === null) {
      return;
    }
    const targetIndex = fileTargetIndex;
    updateEpisode(targetIndex, {
      file_path: item.relative_path,
      file_url: item.file_url || "",
      duration: "读取中...",
    });
    setFileModalOpen(false);
    setFileTargetIndex(null);
    try {
      const resp = await CineAPI.getMediaInfo(item.relative_path);
      const info = resp.getData();
      updateEpisode(targetIndex, {
        duration: info?.duration || "",
        thumbnail: info?.thumbnail || "",
      });
    } catch {
      updateEpisode(targetIndex, { duration: "" });
      message.warning("视频时长或默认封面读取失败，保存时会再次尝试解析");
    }
  };

  const refreshEpisodeThumbnail = async (index: number, filePath: string) => {
    if (!filePath.trim()) {
      message.warning("请先选择视频文件");
      return;
    }

    setThumbnailRefreshingIndex(index);
    try {
      const resp = await CineAPI.getMediaInfo(filePath);
      const info = resp.getData();
      updateEpisode(index, {
        duration: info?.duration || "",
        thumbnail: info?.thumbnail || "",
      });
      if (info?.thumbnail) {
        message.success("缩略图已重新抽取");
      } else {
        message.warning("缩略图抽取失败，请检查 OSS 或视频文件");
      }
    } catch {
      message.error("重新抽取缩略图失败");
    } finally {
      setThumbnailRefreshingIndex(null);
    }
  };

  const goParentDir = () => {
    if (!mediaState.current) {
      return;
    }
    const parts = mediaState.current.split("/").filter(Boolean);
    parts.pop();
    loadMediaFiles(parts.join("/"));
  };

  const columns: ColumnsType<CineAPI.CineRecord> = [
    {
      title: "影视名称",
      dataIndex: "name",
      fixed: "left",
      width: 220,
      render: (name) => <a>{name}</a>,
    },
    {
      title: "简介",
      dataIndex: "description",
      ellipsis: true,
      render: (description) => description || "-",
    },
    {
      title: "分类",
      dataIndex: "genre",
      width: 100,
      render: (genre?: string[]) =>
        genre?.length ? (
          <Space size={[4, 4]} wrap>
            {genre.map((item) => (
              <Tag key={item} color="blue">
                {item}
              </Tag>
            ))}
          </Space>
        ) : (
          "-"
        ),
    },
    {
      title: "剧集数",
      dataIndex: "episodes",
      width: 100,
      render: (items) => <Tag color="blue">{items?.length || 0} 集</Tag>,
    },
    {
      title: "操作",
      width: 300,
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Button icon={<SettingOutlined />} onClick={() => openEpisodeModal(record)}>
            配置剧集
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: "确认删除影视",
                content: "删除后影视及其关联剧集资源记录都会被永久删除。",
                okText: "删除",
                cancelText: "取消",
                okButtonProps: { danger: true },
                onOk: async () => {
                  await CineAPI.deleteCine(record.id);
                  message.success("影视已删除");
                  loadData();
                },
              });
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const fieldLabelStyle: CSSProperties = {
    marginBottom: 6,
    color: "#6b7280",
    fontSize: 12,
    lineHeight: "18px",
  };

  const renderEpisodeItem = (record: EpisodeDraft, index: number) => {
    const episodeNo = index + 1;
    const episodeNoLabel = `【${String(episodeNo).padStart(2, "0")}】`;

    return (
      <div
        key={record.key}
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 136px",
          gap: 16,
          alignItems: "center",
          padding: "14px 16px",
          border: "1px solid #edf0f2",
          borderRadius: 8,
          background: "#fff",
        }}
      >
        <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 140px",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div>
              <div style={fieldLabelStyle}>名称</div>
              <Space.Compact style={{ width: "100%" }}>
                <Space.Addon>{episodeNoLabel}</Space.Addon>
                <Input
                  value={record.name}
                  placeholder="请输入剧集名称"
                  onChange={(event) => updateEpisode(index, { name: event.target.value })}
                />
              </Space.Compact>
            </div>
            <div>
              <div style={fieldLabelStyle}>时长</div>
              <Input value={record.duration} placeholder="选择视频后自动读取" readOnly />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "220px minmax(0, 1fr)",
              gap: 12,
              alignItems: "start",
            }}
          >
            <div>
              <Flex align="center" gap={4} style={fieldLabelStyle}>
                <span>缩略图</span>
                <Tooltip title="重新抽取">
                  <Button
                    type="text"
                    size="small"
                    style={{ height: 14, lineHeight: "14px" }}
                    icon={<ReloadOutlined style={{ fontSize: 10 }} />}
                    loading={thumbnailRefreshingIndex === index}
                    onClick={() => refreshEpisodeThumbnail(index, record.file_path)}
                  />
                </Tooltip>
              </Flex>
              <ImageUploadInput
                value={record.thumbnail}
                onChange={(value) => updateEpisode(index, { thumbnail: value })}
              />
            </div>
            <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
              <div>
                <div style={fieldLabelStyle}>简介</div>
                <Input
                  value={record.description}
                  placeholder="可选简介"
                  onChange={(event) => updateEpisode(index, { description: event.target.value })}
                />
              </div>
              <div>
                <div style={fieldLabelStyle}>视频文件</div>
                <Space.Compact style={{ width: "100%" }}>
                  <Input value={record.file_path} placeholder="请选择文件" readOnly />
                  <Button onClick={() => openFileSelector(index)}>选择</Button>
                </Space.Compact>
              </div>
            </div>
          </div>
        </div>

        <Space
          style={{
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Tooltip title="上移">
            <Button icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => moveEpisode(index, -1)} />
          </Tooltip>
          <Tooltip title="下移">
            <Button
              icon={<ArrowDownOutlined />}
              disabled={index === episodes.length - 1}
              onClick={() => moveEpisode(index, 1)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => setEpisodes((prev) => prev.filter((_, i) => i !== index))}
            />
          </Tooltip>
        </Space>
      </div>
    );
  };

  useEffect(() => {
    loadData();
    loadMediaRoot();
  }, []);

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>影视管理</h2>
        <Space>
          <Button icon={<FolderOpenOutlined />} onClick={openRootModal}>
            配置资源目录
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新增影视
          </Button>
        </Space>
      </Flex>

      <Form
        form={queryForm}
        layout="inline"
        style={{ marginBottom: 16 }}
        onFinish={(values) => {
          const next = { ...query, page: 1, keyword: values.keyword || "" };
          setQuery(next);
          loadData(next);
        }}
      >
        <Form.Item name="keyword">
          <Input allowClear placeholder="搜索影视名称" prefix={<SearchOutlined />} />
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit">搜索</Button>
        </Form.Item>
      </Form>

      <Table
        rowKey="id"
        dataSource={cinePage.list}
        columns={columns}
        pagination={{
          current: cinePage.page,
          pageSize: cinePage.size,
          total: cinePage.total,
          onChange: (page, size) => {
            const next = { ...query, page, size };
            setQuery(next);
            loadData(next);
          },
        }}
      />

      <Modal
        title={editing ? "编辑影视" : "新增影视"}
        open={cineModalOpen}
        onCancel={() => setCineModalOpen(false)}
        onOk={saveCine}
        okText="确认"
        cancelText="取消"
        width={720}
      >
        <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 8 }}>
          <Form form={form} layout="vertical">
            <Form.Item name="name" label="影视名称" rules={[{ required: true, message: "请输入影视名称" }]}>
              <Input placeholder="请输入影视名称" />
            </Form.Item>
            <Form.Item name="description" label="简介">
              <Input.TextArea rows={4} placeholder="请输入简介" />
            </Form.Item>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Form.Item name="genre" label="类型">
                <Select
                  mode="tags"
                  tokenSeparators={[",", "，"]}
                  placeholder="输入类型后回车，例如 剧情、科幻"
                  options={[
                    { label: "剧情", value: "剧情" },
                    { label: "科幻", value: "科幻" },
                    { label: "惊悚", value: "惊悚" },
                    { label: "喜剧", value: "喜剧" },
                    { label: "爱情", value: "爱情" },
                    { label: "纪录片", value: "纪录片" },
                    { label: "仙侠", value: "仙侠" },
                    { label: "赛事", value: "赛事" },
                    { label: "动漫", value: "动漫" },
                    { label: "玄幻", value: "玄幻" },
                    { label: "悬疑", value: "悬疑" },
                  ]}
                />
              </Form.Item>
              <Form.Item name="year" label="年份">
                <Input placeholder="例如 2026" />
              </Form.Item>
              <Form.Item name="season" label="季">
                <Input placeholder="例如 第 1 季" />
              </Form.Item>
              <Form.Item name="rating" label="分级">
                <Input placeholder="例如 16+" />
              </Form.Item>
            </div>
            <Form.Item name="poster" label="海报">
              <ImageUploadInput />
            </Form.Item>
            <Form.Item name="backdrop" label="封面">
              <ImageUploadInput />
            </Form.Item>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Form.Item name="badge" label="角标">
                <Input placeholder="例如 新剧集" />
              </Form.Item>
              <Form.Item name="meta" label="副标题">
                <Input placeholder="例如 剧情 • 2026" />
              </Form.Item>
            </div>
            <Form.Item name="castText" label="演员">
              <Input.TextArea rows={3} placeholder="每行一个演员，或用逗号分隔" />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      <Modal
        title={`配置剧集${currentCine ? `：${currentCine.name}` : ""}`}
        open={episodeModalOpen}
        onCancel={() => setEpisodeModalOpen(false)}
        onOk={saveEpisodes}
        width={960}
        okText="保存"
        cancelText="取消"
      >
        <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
          <span>列表顺序即播放顺序。</span>
          <Button icon={<PlusOutlined />} onClick={() => setEpisodes((prev) => [...prev, createEpisodeDraft()])}>
            添加剧集
          </Button>
        </Flex>
        <div
          style={{
            display: "grid",
            gap: 10,
            maxHeight: "56vh",
            overflowY: "auto",
            paddingRight: 4,
          }}
        >
          {episodes.length ? (
            episodes.map(renderEpisodeItem)
          ) : (
            <div
              style={{
                padding: "32px 16px",
                border: "1px dashed #d9d9d9",
                borderRadius: 8,
                color: "#8c8c8c",
                textAlign: "center",
              }}
            >
              暂无剧集
            </div>
          )}
        </div>
      </Modal>

      <Modal
        title="选择服务器视频文件"
        open={fileModalOpen}
        onCancel={() => setFileModalOpen(false)}
        footer={null}
        width={760}
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Flex justify="space-between" align="center">
            <span>
              资源根目录：
              <Tag color="blue">{mediaState.root || mediaRoot?.root || "未配置"}</Tag>
            </span>
            <Button onClick={openRootModal}>配置资源目录</Button>
          </Flex>
          <Flex justify="space-between" align="center">
            <span>
              当前目录：<Tag>{mediaState.current || "/"}</Tag>
            </span>
            <Button disabled={!mediaState.current} onClick={goParentDir}>
              返回上级
            </Button>
          </Flex>
        </Space>
        <Table
          style={{ marginTop: 12 }}
          rowKey="relative_path"
          dataSource={mediaState.items}
          pagination={false}
          columns={[
            {
              title: "名称",
              dataIndex: "name",
              render: (name, record) => (
                <Space>
                  {record.type === "directory" ? <FolderOpenOutlined /> : <FileOutlined />}
                  <a onClick={() => chooseFile(record)}>{name}</a>
                </Space>
              ),
            },
            {
              title: "类型",
              dataIndex: "type",
              width: 100,
              render: (type) => (type === "directory" ? <Tag>目录</Tag> : <Tag color="blue">视频</Tag>),
            },
            {
              title: "路径",
              dataIndex: "relative_path",
              ellipsis: true,
            },
          ]}
        />
      </Modal>

      <Modal
        title="配置视频资源目录"
        open={rootModalOpen}
        onCancel={() => setRootModalOpen(false)}
        onOk={saveMediaRoot}
        okText="保存"
        cancelText="取消"
      >
        <Form form={rootForm} layout="vertical">
          <Form.Item
            name="root"
            label="服务器视频资源根目录"
            rules={[{ required: true, message: "请输入资源目录" }]}
            extra="可以填写绝对路径，例如 D:\\videos；也可以填写相对路径，例如 ./media。保存后会自动创建目录。"
          >
            <Input placeholder="例如 D:\\videos 或 ./media" />
          </Form.Item>
          <Form.Item label="当前解析路径">
            <Input value={mediaRoot?.root || "-"} readOnly />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
