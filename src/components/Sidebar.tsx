"use client";
import * as React from 'react';
import Link from 'next/link';
import { useState, Dispatch, SetStateAction } from 'react';
import { usePathname } from 'next/navigation';
import { BsFillStarFill, BsLayoutSplit, BsBriefcaseFill, BsPersonFillGear, BsFolder, BsFillChatRightQuoteFill , BsHouseGear, BsCalendar2Plus, BsBarChartLineFill, BsList, BsChevronDown, BsChevronRight, BsFileText, BsCardChecklist, BsGraphUpArrow, BsClipboard2Data } from 'react-icons/bs';
import { MdGroups } from "react-icons/md";
import { FaFileInvoiceDollar } from "react-icons/fa6";
import { IconType } from 'react-icons';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Collapse } from '@mui/material';
import styles from './Sidebar.module.css';
import { useAuth } from '@/data/AuthContext';

// Define la estructura de los datos del menú
export interface MenuItem {
    name: string;
    icon: IconType;
    link?: string;
    children?: MenuItem[];
    permissionTask?: string;
}

const menuItems: MenuItem[] = [
    {
        name: "Favoritos",
        icon: BsFillStarFill,
        link: "/inicio/favoritos",
        permissionTask: "Favoritos",
    },
    {
        name: "Inicio",
        icon: BsLayoutSplit,
        link: "/inicio",
        permissionTask: "inicio",
    },
    {
        name: "Empleador",
        icon: BsBriefcaseFill,
        permissionTask: "Empleador",
        children: [
            { name: "Póliza", icon: BsFileText, link: "/inicio/empleador/poliza", permissionTask: "empleador_Poliza"},
            { name: "Cobertura", icon: BsCardChecklist, link: "/inicio/empleador/cobertura", permissionTask: "empleador_Cobertura"},
            { name: "Cuenta Corriente", icon: BsGraphUpArrow, link: "/inicio/empleador/cuentaCorriente", permissionTask: "empleador_CuentaCorriente" },
            { name: "Formulario RGRL", icon: BsClipboard2Data, link: "/inicio/empleador/formularioRGRL", permissionTask: "empleador_FormularioRGRL" },
            { name: "Formulario RAR", icon: BsClipboard2Data, link: "/inicio/empleador/formularioRAR", permissionTask: "empleador_FormularioRAR" },
            { name: "Siniestros", icon: BsCalendar2Plus, link: "/inicio/empleador/siniestros", permissionTask: "empleador_Siniestros" },
            { name: "Avisos de Obra", icon: BsHouseGear, link: "/inicio/empleador/avisosDeObra", permissionTask: "empleador_AvisoDeObra" },
            { name: "SVCC", icon: BsFolder, link: "/inicio/empleador/svcc", permissionTask: "empleador_SVCC" },
           // { name: "Credenciales", icon: BsCreditCard, link: "/inicio/empleador/credenciales", permissionTask: "empleador_Credenciales"},
        ],
    },
    {
        name: "Comercializador",
        icon: BsBriefcaseFill,
        permissionTask: "Comercializador",
        children: [
            { name: "Cuenta Corriente", icon: BsGraphUpArrow, link: "/inicio/comercializador/cuentaCorriente", permissionTask: "Comercializador_CuentaCorriente" },
            { name: "Polizas", icon: BsFileText, link: "/inicio/comercializador/polizas",permissionTask: "Comercializador_Polizas" },
            { name: "Administración", icon: MdGroups , link: "/inicio/comercializador/administracionUsuarios", permissionTask: "Comercializador_Administracion" },
        ],
    },
    {
        name: "Cotizaciones",
        icon: FaFileInvoiceDollar,
        link: "/inicio/cotizaciones",
        permissionTask: "Cotizaciones",
    },
    {
        name: "Informes",
        icon: BsBarChartLineFill,
        permissionTask: "Informes",
        children: [
            { name: "Comisiones Médicas", icon: BsGraphUpArrow, link: "/inicio/informes/comisionesMedicas", permissionTask: "Informes_ComisionesMedicas" },
            { name: "Siniestros", icon: BsGraphUpArrow, link: "/inicio/informes/siniestros", permissionTask: "Informes_Siniestros" },
            { name: "Atención Al Público", icon: BsGraphUpArrow, link: "/inicio/informes/atencionAlPublico", permissionTask: "Informes_AtencionAlPublico" },
    ],
  },
  {
    name: "Denuncias",
    icon: BsFillChatRightQuoteFill,
    link: "/inicio/denuncias",
    permissionTask: "Denuncias",
  },
  {
    name: "Usuarios",
    icon: BsPersonFillGear,
    link: "/inicio/usuarios",
    permissionTask: "Usuarios",
  },
];


export interface SidebarProps {
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}


const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
    const [isLocked, setIsLocked] = useState(false);
    const [openMenus, setOpenMenus] = useState<string[]>([]);
    const pathname = usePathname();
    const { hasTask } = useAuth();

    const handleMenuClick = (menuName: string) => {
      setOpenMenus(prevOpenMenus => {
        if (prevOpenMenus.includes(menuName)) {
          return prevOpenMenus.filter(name => name !== menuName);
        } else {
          return [...prevOpenMenus, menuName];
        }
      });
    };

    const handleToggleLock = () => {
        if (isLocked) {
            setIsLocked(false);
            setIsOpen(false);
        } else {
            setIsLocked(true);
            setIsOpen(true);
        }
    };

    const handleMouseEnter = () => {
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        if (!isLocked) {
            setIsOpen(false);
        }
    };

    const renderMenuItems = (items: MenuItem[], isSubmenu: boolean = false) => {
        return items.map((item) => {
            if (item.permissionTask && !hasTask(item.permissionTask)) {
                return null;
            }

            if (item.children) {
                const renderedChildren = renderMenuItems(item.children, true);
                const filteredChildren = renderedChildren.filter(child => child !== null);
                
                if (filteredChildren.length === 0) {
                    return null;
                }

                const isMenuOpen = openMenus.includes(item.name);
                const listItemButtonClasses = `${styles.menuItemButton} ${isOpen ? styles.menuItemButtonOpen : styles.menuItemButtonClosed} ${isSubmenu ? styles.submenuItem : ''}`;
                const listItemIconClasses = `${styles.icon} ${isOpen ? styles.iconOpen : styles.iconClosed}`;
                const listItemTextClasses = `${isOpen ? styles.linkTextVisible : styles.linkTextHidden}`;
                const arrowIconClasses = `${styles.accordionIcon}`;

                return (
                    <React.Fragment key={item.name}>
                        <ListItem disablePadding className={styles.listItem}>
                            <ListItemButton
                                onClick={() => handleMenuClick(item.name)}
                                className={listItemButtonClasses}
                            >
                                <ListItemIcon className={listItemIconClasses}>
                                    <item.icon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.name}
                                    className={listItemTextClasses}
                                />
                                {isOpen && (isMenuOpen ? <BsChevronDown className={arrowIconClasses} /> : <BsChevronRight className={arrowIconClasses} />)}
                            </ListItemButton>
                        </ListItem>
                        <Collapse in={isMenuOpen} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding className={styles.submenu}>
                                {filteredChildren}
                            </List>
                        </Collapse>
                    </React.Fragment>
                );
            }
            
            const isActive = item.link === pathname;
            const listItemButtonClasses = `${styles.menuItemButton} ${isOpen ? styles.menuItemButtonOpen : styles.menuItemButtonClosed} ${isSubmenu ? styles.submenuItem : ''} ${isActive ? styles.activeLink : ''}`;
            const listItemIconClasses = `${styles.icon} ${isOpen ? styles.iconOpen : styles.iconClosed}`;
            const listItemTextClasses = `${isOpen ? styles.linkTextVisible : styles.linkTextHidden}`;

            return (
                <React.Fragment key={item.name}>
                    <ListItem disablePadding className={styles.listItem}>
                        <ListItemButton
                            component={Link}
                            href={item.link || "#"}
                            className={listItemButtonClasses}
                        >
                            <ListItemIcon className={listItemIconClasses}>
                                <item.icon />
                            </ListItemIcon>
                            <ListItemText
                                primary={item.name}
                                className={listItemTextClasses}
                            />
                        </ListItemButton>
                    </ListItem>
                </React.Fragment>
            );
        });
    };

    return (
        <Box
            className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : styles.sidebarClosed}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Box 
                className={`${styles.header} ${isOpen ? styles.headerOpen : ''} ${isLocked ? styles.headerLocked : ''}`}
                onClick={handleToggleLock}
            >
                <button className={styles.toggleButton}>
                    <BsList />
                </button>
                {isOpen && <span className={styles.headerText}>ART Gestión</span>}
            </Box>
            <List className={styles.listContainer}>
                {renderMenuItems(menuItems)}
            </List>
        </Box>
    );
};

export default Sidebar;