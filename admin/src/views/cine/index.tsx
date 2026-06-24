import { useEffect, useState } from "react";
import {
  Button,
  Flex,
  Form,
  Input,
  message,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  FileOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
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
    file_path: "",
    file_url: "",
  };
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
  const [currentCine, setCurrentCine] = useState<CineAPI.CineRecord | null>(
    null,
  );
  const [episodes, setEpisodes] = useState<EpisodeDraft[]>([]);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [fileTargetIndex, setFileTargetIndex] = useState<number | null>(null);
  const [rootModalOpen, setRootModalOpen] = useState(false);
  const [rootForm] = Form.useForm();
  const [mediaRoot, setMediaRoot] = useState<CineAPI.MediaRootSetting | null>(
    null,
  );
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
    });
    setCineModalOpen(true);
  };

  const saveCine = async () => {
    const values = await form.validateFields();
    if (editing) {
      await CineAPI.updateCine(editing.id, values);
      message.success("影视更新成功");
    } else {
      await CineAPI.createCine(values);
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
            file_path: episode.file_path,
            file_url: episode.file_url || "",
          }))
        : [],
    );
    setEpisodeModalOpen(true);
  };

  const updateEpisode = (index: number, patch: Partial<EpisodeDraft>) => {
    setEpisodes((prev) =>
      prev.map((episode, i) =>
        i === index ? { ...episode, ...patch } : episode,
      ),
    );
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
    const invalid = episodes.some(
      (episode) => !episode.name.trim() || !episode.file_path.trim(),
    );
    if (invalid) {
      message.error("每集都必须填写名称并选择视频文件");
      return;
    }
    await CineAPI.replaceEpisodes(
      currentCine.id,
      episodes.map(({ key, ...episode }) => episode),
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

  const chooseFile = (item: CineAPI.MediaFileItem) => {
    if (item.type === "directory") {
      loadMediaFiles(item.relative_path);
      return;
    }
    if (fileTargetIndex === null) {
      return;
    }
    updateEpisode(fileTargetIndex, {
      file_path: item.relative_path,
      file_url: item.file_url || "",
    });
    setFileModalOpen(false);
    setFileTargetIndex(null);
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
          <Button
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          <Button
            icon={<SettingOutlined />}
            onClick={() => openEpisodeModal(record)}
          >
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

  const episodeColumns: ColumnsType<EpisodeDraft> = [
    {
      title: "顺序",
      width: 70,
      render: (_, __, index) => index + 1,
    },
    {
      title: "名称",
      width: 180,
      render: (_, record, index) => (
        <Input
          value={record.name}
          placeholder="必填"
          onChange={(event) =>
            updateEpisode(index, { name: event.target.value })
          }
        />
      ),
    },
    {
      title: "简介",
      render: (_, record, index) => (
        <Input
          value={record.description}
          placeholder="可选"
          onChange={(event) =>
            updateEpisode(index, { description: event.target.value })
          }
        />
      ),
    },
    {
      title: "视频文件",
      width: 280,
      render: (_, record, index) => (
        <Space.Compact style={{ width: "100%" }}>
          <Input value={record.file_path} placeholder="请选择文件" readOnly />
          <Button onClick={() => openFileSelector(index)}>选择</Button>
        </Space.Compact>
      ),
    },
    {
      title: "操作",
      width: 160,
      render: (_, __, index) => (
        <Space>
          <Tooltip title="上移">
            <Button
              icon={<ArrowUpOutlined />}
              disabled={index === 0}
              onClick={() => moveEpisode(index, -1)}
            />
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
              onClick={() =>
                setEpisodes((prev) => prev.filter((_, i) => i !== index))
              }
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
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
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="影视名称"
            rules={[{ required: true, message: "请输入影视名称" }]}
          >
            <Input placeholder="请输入影视名称" />
          </Form.Item>
          <Form.Item name="description" label="简介">
            <Input.TextArea rows={4} placeholder="请输入简介" />
          </Form.Item>
        </Form>
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
          <Button
            icon={<PlusOutlined />}
            onClick={() => setEpisodes((prev) => [...prev, createEpisodeDraft()])}
          >
            添加剧集
          </Button>
        </Flex>
        <Table
          rowKey="key"
          dataSource={episodes}
          columns={episodeColumns}
          pagination={false}
        />
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
              <Tag color="blue">
                {mediaState.root || mediaRoot?.root || "未配置"}
              </Tag>
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
                  {record.type === "directory" ? (
                    <FolderOpenOutlined />
                  ) : (
                    <FileOutlined />
                  )}
                  <a onClick={() => chooseFile(record)}>{name}</a>
                </Space>
              ),
            },
            {
              title: "类型",
              dataIndex: "type",
              width: 100,
              render: (type) =>
                type === "directory" ? (
                  <Tag>目录</Tag>
                ) : (
                  <Tag color="blue">视频</Tag>
                ),
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
