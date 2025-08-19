'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Title1,
  Title2,
  Title3,
  Body1,
  Caption1,
  Divider,
  Input,
  Label,
  Dropdown,
  Option,
  Checkbox,
  RadioGroup,
  Radio,
  Switch,
  Slider,
  SpinButton,
  Textarea,
  Badge,
  Avatar,
  Spinner,
  ProgressBar,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Toast,
  ToastTitle,
  ToastBody,
  Toaster,
  useToastController,
  useId,
  Tab,
  TabList,
  SelectTabData,
  SelectTabEvent,
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  makeStyles,
  tokens,
  FluentProvider,
  webLightTheme,
  webDarkTheme
} from '@fluentui/react-components';
import {
  PlayRegular,
  PauseRegular,
  StopRegular,
  ArrowClockwise24Regular,
  SettingsRegular,
  InfoRegular,
  WarningRegular,
  ErrorCircleRegular,
  CheckmarkCircleRegular,
  DismissRegular,
  AddRegular,
  DeleteRegular,
  EditRegular,
  SaveRegular,
  SearchRegular,
  FilterRegular,
  MoreHorizontalRegular,
  ChevronDownRegular,
  ChevronUpRegular,
  HomeRegular,
  PersonRegular,
  CalendarRegular,
  MailRegular,
  PhoneRegular,
  LocationRegular
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalXL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  componentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: tokens.spacingHorizontalL
  },
  componentCard: {
    padding: tokens.spacingVerticalM
  },
  componentGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  buttonGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    marginBottom: tokens.spacingVerticalS
  },
  badgeGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap'
  },
  avatarGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center'
  },
  progressGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  messageBarGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  tabContent: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    marginTop: tokens.spacingVerticalS
  },
  accordionContent: {
    padding: tokens.spacingVerticalS
  },
  toolbarContainer: {
    marginBottom: tokens.spacingVerticalM
  },
  themeToggle: {
    position: 'fixed',
    top: tokens.spacingVerticalL,
    right: tokens.spacingHorizontalL,
    zIndex: 1000
  }
});

export function UIComponentTest() {
  const styles = useStyles();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);
  
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>('buttons');
  const [inputValue, setInputValue] = useState('');
  const [dropdownValue, setDropdownValue] = useState<string[]>([]);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [radioValue, setRadioValue] = useState('option1');
  const [switchChecked, setSwitchChecked] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [spinButtonValue, setSpinButtonValue] = useState(10);
  const [textAreaValue, setTextAreaValue] = useState('');
  const [progressValue, setProgressValue] = useState(0.6);
  const [dialogOpen, setDialogOpen] = useState(false);

  const showToast = (intent: 'success' | 'warning' | 'error' | 'info') => {
    const messages = {
      success: { title: 'Berhasil!', body: 'Operasi berhasil dilakukan.' },
      warning: { title: 'Peringatan!', body: 'Ada yang perlu diperhatikan.' },
      error: { title: 'Error!', body: 'Terjadi kesalahan sistem.' },
      info: { title: 'Informasi', body: 'Ini adalah pesan informasi.' }
    };
    
    dispatchToast(
      <Toast>
        <ToastTitle>{messages[intent].title}</ToastTitle>
        <ToastBody>{messages[intent].body}</ToastBody>
      </Toast>,
      { intent, timeout: 3000 }
    );
  };

  const onTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
    setSelectedTab(data.value as string);
  };

  const renderButtonsTab = () => (
    <div className={styles.componentGroup}>
      <Title3>Buttons</Title3>
      <div className={styles.buttonGroup}>
        <Button appearance="primary">Primary</Button>
        <Button appearance="secondary">Secondary</Button>
        <Button appearance="outline">Outline</Button>
        <Button appearance="subtle">Subtle</Button>
        <Button appearance="transparent">Transparent</Button>
      </div>
      
      <div className={styles.buttonGroup}>
        <Button icon={<PlayRegular />}>With Icon</Button>
        <Button icon={<AddRegular />} iconPosition="after">Icon After</Button>
        <Button icon={<ArrowClockwise24Regular />} />
        <Button disabled>Disabled</Button>
      </div>
      
      <div className={styles.buttonGroup}>
        <Button size="small">Small</Button>
        <Button size="medium">Medium</Button>
        <Button size="large">Large</Button>
      </div>
    </div>
  );

  const renderInputsTab = () => (
    <div className={styles.componentGroup}>
      <Title3>Form Controls</Title3>
      
      <div className={styles.formGroup}>
        <Label htmlFor="input1">Text Input</Label>
        <Input
          id="input1"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Masukkan teks..."
        />
      </div>
      
      <div className={styles.formGroup}>
        <Label htmlFor="dropdown1">Dropdown</Label>
        <Dropdown
          id="dropdown1"
          placeholder="Pilih opsi..."
          value={dropdownValue.join(', ')}
          selectedOptions={dropdownValue}
          onOptionSelect={(e, data) => setDropdownValue(data.selectedOptions)}
          multiselect
        >
          <Option value="option1">Opsi 1</Option>
          <Option value="option2">Opsi 2</Option>
          <Option value="option3">Opsi 3</Option>
          <Option value="option4">Opsi 4</Option>
        </Dropdown>
      </div>
      
      <div className={styles.formGroup}>
        <Checkbox
          checked={checkboxChecked}
          onChange={(e) => setCheckboxChecked(e.currentTarget.checked)}
          label="Checkbox Option"
        />
      </div>
      
      <div className={styles.formGroup}>
        <Label>Radio Group</Label>
        <RadioGroup
          value={radioValue}
          onChange={(e, data) => setRadioValue(data.value)}
        >
          <Radio value="option1" label="Radio Option 1" />
          <Radio value="option2" label="Radio Option 2" />
          <Radio value="option3" label="Radio Option 3" />
        </RadioGroup>
      </div>
      
      <div className={styles.formGroup}>
        <Switch
          checked={switchChecked}
          onChange={(e) => setSwitchChecked(e.currentTarget.checked)}
          label="Switch Toggle"
        />
      </div>
      
      <div className={styles.formGroup}>
        <Label>Slider: {sliderValue}</Label>
        <Slider
          value={sliderValue}
          onChange={(e, data) => setSliderValue(data.value)}
          min={0}
          max={100}
          step={5}
        />
      </div>
      
      <div className={styles.formGroup}>
        <Label htmlFor="spinbutton1">Spin Button</Label>
        <SpinButton
          id="spinbutton1"
          value={spinButtonValue}
          onChange={(e, data) => setSpinButtonValue(data.value || 0)}
          min={0}
          max={100}
          step={1}
        />
      </div>
      
      <div className={styles.formGroup}>
        <Label htmlFor="textarea1">Text Area</Label>
        <Textarea
                  id="textarea1"
                  value={textAreaValue}
                  onChange={(e) => setTextAreaValue(e.target.value)}
          placeholder="Masukkan teks panjang..."
          rows={4}
        />
      </div>
    </div>
  );

  const renderDisplayTab = () => (
    <div className={styles.componentGroup}>
      <Title3>Display Components</Title3>
      
      <div className={styles.formGroup}>
        <Label>Badges</Label>
        <div className={styles.badgeGroup}>
          <Badge>Default</Badge>
          <Badge appearance="filled">Filled</Badge>
          <Badge appearance="outline">Outline</Badge>
          <Badge appearance="tint">Tint</Badge>
          <Badge color="success">Success</Badge>
          <Badge color="warning">Warning</Badge>
          <Badge color="danger">Danger</Badge>
          <Badge color="important">Important</Badge>
        </div>
      </div>
      
      <div className={styles.formGroup}>
        <Label>Avatars</Label>
        <div className={styles.avatarGroup}>
          <Avatar name="John Doe" />
          <Avatar name="Jane Smith" color="colorful" />
          <Avatar icon={<PersonRegular />} />
          <Avatar name="Bob Wilson" size={32} />
          <Avatar name="Alice Brown" size={48} />
        </div>
      </div>
      
      <div className={styles.formGroup}>
        <Label>Progress & Loading</Label>
        <div className={styles.progressGroup}>
          <ProgressBar value={progressValue} />
          <ProgressBar value={0.3} color="success" />
          <ProgressBar value={0.8} color="warning" />
          <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center' }}>
            <Spinner size="tiny" />
            <Spinner size="extra-small" />
            <Spinner size="small" />
            <Spinner size="medium" />
            <Spinner size="large" />
          </div>
        </div>
      </div>
      
      <div className={styles.formGroup}>
        <Label>Message Bars</Label>
        <div className={styles.messageBarGroup}>
          <MessageBar intent="info">
            <MessageBarBody>
              <MessageBarTitle>Info Message</MessageBarTitle>
              Ini adalah pesan informasi.
            </MessageBarBody>
          </MessageBar>
          
          <MessageBar intent="success">
            <MessageBarBody>
              <MessageBarTitle>Success Message</MessageBarTitle>
              Operasi berhasil dilakukan.
            </MessageBarBody>
          </MessageBar>
          
          <MessageBar intent="warning">
            <MessageBarBody>
              <MessageBarTitle>Warning Message</MessageBarTitle>
              Ada yang perlu diperhatikan.
            </MessageBarBody>
          </MessageBar>
          
          <MessageBar intent="error">
            <MessageBarBody>
              <MessageBarTitle>Error Message</MessageBarTitle>
              Terjadi kesalahan sistem.
            </MessageBarBody>
          </MessageBar>
        </div>
      </div>
    </div>
  );

  const renderInteractiveTab = () => (
    <div className={styles.componentGroup}>
      <Title3>Interactive Components</Title3>
      
      <div className={styles.formGroup}>
        <Label>Toast Notifications</Label>
        <div className={styles.buttonGroup}>
          <Button onClick={() => showToast('success')} icon={<CheckmarkCircleRegular />}>
            Success Toast
          </Button>
          <Button onClick={() => showToast('warning')} icon={<WarningRegular />}>
            Warning Toast
          </Button>
          <Button onClick={() => showToast('error')} icon={<ErrorCircleRegular />}>
            Error Toast
          </Button>
          <Button onClick={() => showToast('info')} icon={<InfoRegular />}>
            Info Toast
          </Button>
        </div>
      </div>
      
      <div className={styles.formGroup}>
        <Label>Dialog</Label>
        <Dialog open={dialogOpen} onOpenChange={(e, data) => setDialogOpen(data.open)}>
          <DialogTrigger disableButtonEnhancement>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogSurface>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogContent>
              <DialogBody>
                Ini adalah contoh dialog dengan konten yang dapat disesuaikan.
                Dialog ini dapat digunakan untuk konfirmasi, form, atau informasi tambahan.
              </DialogBody>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button appearance="primary">Confirm</Button>
            </DialogActions>
          </DialogSurface>
        </Dialog>
      </div>
      
      <div className={styles.formGroup}>
        <Label>Accordion</Label>
        <Accordion multiple collapsible>
          <AccordionItem value="item1">
            <AccordionHeader>Accordion Item 1</AccordionHeader>
            <AccordionPanel>
              <div className={styles.accordionContent}>
                Konten accordion pertama. Ini dapat berisi teks, form, atau komponen lainnya.
              </div>
            </AccordionPanel>
          </AccordionItem>
          
          <AccordionItem value="item2">
            <AccordionHeader>Accordion Item 2</AccordionHeader>
            <AccordionPanel>
              <div className={styles.accordionContent}>
                Konten accordion kedua dengan informasi yang berbeda.
              </div>
            </AccordionPanel>
          </AccordionItem>
          
          <AccordionItem value="item3">
            <AccordionHeader>Accordion Item 3</AccordionHeader>
            <AccordionPanel>
              <div className={styles.accordionContent}>
                Konten accordion ketiga untuk menunjukkan fleksibilitas komponen.
              </div>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </div>
      
      <div className={styles.formGroup}>
        <Label>Menu</Label>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button icon={<MoreHorizontalRegular />}>Menu Options</Button>
          </MenuTrigger>
          
          <MenuPopover>
            <MenuList>
              <MenuItem icon={<AddRegular />}>Add Item</MenuItem>
              <MenuItem icon={<EditRegular />}>Edit Item</MenuItem>
              <MenuItem icon={<DeleteRegular />}>Delete Item</MenuItem>
              <MenuItem icon={<SettingsRegular />}>Settings</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </div>
      
      <div className={styles.formGroup}>
        <Label>Toolbar</Label>
        <div className={styles.toolbarContainer}>
          <Toolbar>
            <ToolbarButton icon={<AddRegular />}>Add</ToolbarButton>
            <ToolbarButton icon={<EditRegular />}>Edit</ToolbarButton>
            <ToolbarButton icon={<DeleteRegular />}>Delete</ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton icon={<SearchRegular />}>Search</ToolbarButton>
            <ToolbarButton icon={<FilterRegular />}>Filter</ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton icon={<SettingsRegular />}>Settings</ToolbarButton>
          </Toolbar>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'buttons':
        return renderButtonsTab();
      case 'inputs':
        return renderInputsTab();
      case 'display':
        return renderDisplayTab();
      case 'interactive':
        return renderInteractiveTab();
      default:
        return renderButtonsTab();
    }
  };

  return (
    <FluentProvider theme={isDarkTheme ? webDarkTheme : webLightTheme}>
      <div className={styles.container}>
        {/* Theme Toggle */}
        <div className={styles.themeToggle}>
          <Switch
            checked={isDarkTheme}
            onChange={(e) => setIsDarkTheme(e.currentTarget.checked)}
            label={isDarkTheme ? 'Dark Theme' : 'Light Theme'}
          />
        </div>

        {/* Header */}
        <div className={styles.section}>
          <Title1>UI Component Test</Title1>
          <Body1>
            Halaman ini menampilkan berbagai komponen UI Fluent React untuk testing dan demonstrasi.
            Gunakan tab di bawah untuk menjelajahi kategori komponen yang berbeda.
          </Body1>
        </div>

        <Divider />

        {/* Tab Navigation */}
        <div className={styles.section}>
          <TabList selectedValue={selectedTab} onTabSelect={onTabSelect}>
            <Tab value="buttons">Buttons</Tab>
            <Tab value="inputs">Form Controls</Tab>
            <Tab value="display">Display</Tab>
            <Tab value="interactive">Interactive</Tab>
          </TabList>
          
          <div className={styles.tabContent}>
            {renderTabContent()}
          </div>
        </div>

        {/* Toast Container */}
        <Toaster toasterId={toasterId} />
      </div>
    </FluentProvider>
  );
}

export default UIComponentTest;