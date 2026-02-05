"use client";
import * as React from 'react';
import Link from 'next/link';
import { useState, useEffect, useMemo, Dispatch, SetStateAction } from 'react';
import { usePathname } from 'next/navigation';
import { BsFillStarFill, BsLayoutSplit, BsBriefcaseFill, BsPersonFillGear, BsFolder, BsFillChatRightQuoteFill , BsHouseGear, BsCalendar2Plus, BsBarChartLineFill, BsList, BsChevronDown, BsChevronRight, BsFileText, BsCardChecklist, BsGraphUpArrow, BsClipboard2Data } from 'react-icons/bs';
import { MdGroups } from "react-icons/md";
import { FaFileInvoiceDollar } from "react-icons/fa6";
import { IconType } from 'react-icons';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Collapse, Typography } from '@mui/material';
import styles from './Sidebar.module.css';
import { useAuth } from '@/data/AuthContext';
import { useSearch } from '@/data/SearchContext';

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
            { name: "Administración", icon: MdGroups , link: "/inicio/comercializador/administracionComercializadores", permissionTask: "Comercializador_Administracion" },
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
    const { searchTerm, clearSearch } = useSearch();

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

    // Función para verificar si un texto coincide con el término de búsqueda
    const matchesSearch = (text: string, search: string): boolean => {
        if (!search.trim()) return true;
        return text.toLowerCase().includes(search.toLowerCase());
    };

    // Función para filtrar items recursivamente
    const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
        if (!searchTerm.trim()) return items;

        const filtered: MenuItem[] = [];

        items.forEach((item) => {
            // Verificar permisos primero
            if (item.permissionTask && !hasTask(item.permissionTask)) {
                return;
            }

            const itemMatches = matchesSearch(item.name, searchTerm);
            
            if (item.children) {
                // Filtrar hijos recursivamente
                const filteredChildren = filterMenuItems(item.children);
                
                // Si el item padre coincide o tiene hijos que coinciden, incluirlo
                if (itemMatches || filteredChildren.length > 0) {
                    filtered.push({
                        ...item,
                        children: filteredChildren,
                    });
                }
            } else {
                // Si es un item sin hijos y coincide, incluirlo
                if (itemMatches) {
                    filtered.push(item);
                }
            }
        });

        return filtered;
    };

    // Obtener items filtrados con useMemo para optimizar
    const filteredMenuItems = useMemo(() => filterMenuItems(menuItems), [searchTerm, hasTask]);
    const hasResults = filteredMenuItems.length > 0;

    // Abrir automáticamente los menús que tienen coincidencias cuando hay búsqueda activa
    useEffect(() => {
        if (searchTerm.trim()) {
            const menusToOpen: string[] = [];
            filteredMenuItems.forEach((item) => {
                if (item.children && item.children.length > 0) {
                    menusToOpen.push(item.name);
                }
            });
            setOpenMenus(menusToOpen);
        }
    }, [searchTerm, filteredMenuItems]);

    // Resetear búsqueda cuando se navega (solo cuando el pathname realmente cambia)
    const prevPathnameRef = React.useRef<string>(pathname);
    useEffect(() => {
        // Solo limpiar si el pathname cambió (no en el primer render)
        if (prevPathnameRef.current !== pathname && prevPathnameRef.current) {
            clearSearch();
        }
        prevPathnameRef.current = pathname;
    }, [pathname, clearSearch]);

    const renderMenuItems = (items: MenuItem[], isSubmenu: boolean = false) => {
        return items.map((item) => {
            // Los permisos ya se verifican en filterMenuItems, pero mantenemos esta verificación por seguridad
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
                {searchTerm.trim() && !hasResults ? (
                    <ListItem disablePadding className={styles.listItem}>
                        <Box sx={{ padding: '20px', textAlign: 'center', width: '100%' }}>
                            <Typography 
                                variant="body1" 
                                sx={{ 
                                    color: 'white', 
                                    fontSize: '1.4rem',
                                    fontStyle: 'italic'
                                }}
                            >
                                No se encontraron coincidencias para "{searchTerm}"
                            </Typography>
                        </Box>
                    </ListItem>
                ) : (
                    renderMenuItems(filteredMenuItems)
                )}
            </List>
        </Box>
    );
};

export default Sidebar;