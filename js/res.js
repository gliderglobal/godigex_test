var mainApp = angular.module("mainApp", []);
mainApp.controller('menuController', ['$scope', '$timeout', '$window', function ($scope, $timeout, $window) {
    $scope.restaurantInfo = RestaurantInfo;
    $scope.menudata = [];
    $scope.sectionList = [];
    $scope.categoryList = [];
    $scope.QuanityCount = 1;
    $scope.recommendedItems = [];
    $scope.selectedItems = sessionStorage.getItem('cartValue') == null ? [] : JSON.parse(sessionStorage.getItem('cartValue'));
    $scope.FilterCategory = { "Category": "", "IsVisible": "", "IsClassActive": "" };
    $scope.BillSummary = { "ItemTotal": 0, "GrandTotal": 0, "RestaurantCharges": 0, "DeliveryFee": 0, "Discount": 0, "PolicyDescription": "", "DeliveryNotes": "", "IsShow": false, "HasMinDelivery": false };
    $scope.searchText = "";
    $scope.filterType = 0;
    $scope.alertMessage = "";
    $scope.alertTitle = "Success! ";
    $scope.IsShowAlert = false;
    $scope.IsTableOrder = false;
    TableOrder();
    $scope.FillCategory = function (CategoryName) {


    }
    $scope.showQuantityMenu = function (MenuItem, SectionName) {
        $scope.selectedItem = MenuItem;
        $scope.QuanityCount = 1;
        $scope.submenudata = MenuItem.QuantitySection;
        $scope.selectedIndex = 0;
    }
    $scope.SetSelectedIndex = function (Index) {
        $scope.selectedIndex = Index;
    }
    $scope.SetQuantity = function (IsAdd) {

        if (IsAdd) {
            $scope.QuanityCount++;
        }
        else {
            $scope.QuanityCount--;
        }
    }


    $scope.FilterMenu = function (CategoryName) {
        if (CategoryName != '') {
            let FilteredMenuList = [];
            let searchObject = JSON.parse(JSON.stringify(MenuList));
            angular.forEach(searchObject, function (value, key) {
                let FilteredMenu;
                var menuitems = $.grep(value.MenuItem, function (b) {
                    return b.CategoryName === CategoryName;
                });
                if (menuitems.length > 0) {
                    FilteredMenu = value;
                    FilteredMenu.MenuItem = menuitems;
                    FilteredMenuList.push(FilteredMenu);
                }
            });
            $scope.menudata = FilteredMenuList;
            $scope.FilterCategory.IsClassActive = 1;
            $scope.FilterCategory.Category = CategoryName;
            $scope.FilterCategory.IsVisible = 1;
        }
        else {
            $scope.menudata = JSON.parse(JSON.stringify(MenuList))
            $scope.FilterCategory.IsClassActive = 0;
            $scope.FilterCategory.IsVisible = 0;
            $scope.FilterCategory.Category = "";
        }
        return false;
    }
    $scope.isCateogryfiltering = function (menuItem) {
        if ($scope.FilterCategory.Category == '') {
            return true;
        }


        return menuItem.CategoryName.indexOf($scope.FilterCategory.Category) !== -1;
    };
    $scope.ItemAdd = function (menuItem, IsSubMenuAdd, IsAdd, submenuItem) {

        $scope.selectedItem = menuItem;
        var subItemName = "";
        var itemPrice = menuItem.Price;
        if (IsSubMenuAdd) {
            if (submenuItem) {
                var subItems = $.grep(menuItem.QuantitySection, function (b) {
                    return b.Name == submenuItem;
                });
                console.log(subItems);
                subItemName = '-' + subItems[0].Name;
                itemPrice = subItems[0].Price;
            }
            else if (menuItem.QuantitySection.length >= $scope.selectedIndex) {
                var subItems = menuItem.QuantitySection[$scope.selectedIndex];
                if (subItems == null) {
                    return false;
                }
                subItemName = '-' + subItems.Name;
                itemPrice = subItems.Price;
            }
        }
        var Item = $.grep($scope.selectedItems, function (b) {
            return b.ItemName === menuItem.Item && b.Portion == subItemName;
        });
        if (Item.length > 0) {
            $scope.ItemUpdate(Item[0], IsAdd, IsSubMenuAdd);
        }
        else {
            $scope.selectedItems.push({ "ItemName": menuItem.Item, "Price": itemPrice, "Type": menuItem.Type, "Quantity": IsSubMenuAdd ? $scope.QuanityCount : 1, "Portion": subItemName, "containerCharge": menuItem.ContainerCharge })
        }
        $scope.GenerateBill();
        SaveCartItem();
        $scope.alertMessage = menuItem.Item + " added to the Cart";
        $scope.alertTitle = "Success! ";
        //$scope.IsShowAlert = true;
        $timeout(function () {
            $scope.IsShowAlert = false;
        }, 2000);
        if (!IsSubMenuAdd)
            return false;
    }
    $scope.SelectedQuantity = function (menuItem, subportion) {

        var Item = $.grep($scope.selectedItems, function (b) {
            return b.ItemName === menuItem.Item && (subportion ? b.Portion == '-' + subportion : true);
        });
        if (Item.length > 0)
            return Item[0].Quantity;
        else
            return 0;
    }
    function SaveCartItem() {
        sessionStorage.setItem("cartValue", JSON.stringify($scope.selectedItems));
    }
    $scope.GenerateBill = function () {
        if ($scope.selectedItems.length > 0) {
            let total = 0;
            let containerTotal = 0;
            angular.forEach($scope.selectedItems, function (value, key) {
                console.log(value);
                total = (value.Price * value.Quantity) + total;
                containerTotal = Number(value.containerCharge) + containerTotal;
            });
            $scope.BillSummary.IsShow = true;
            $scope.BillSummary.ItemTotal = total;
            $scope.BillSummary.RestaurantCharges = $scope.IsTableOrder ? 0 : containerTotal;
            $scope.BillSummary.DeliveryFee = $scope.IsTableOrder ? 0 : $scope.restaurantInfo.DeliverCharge;
            $scope.BillSummary.Discount = 0;
            $scope.BillSummary.GrandTotal = total + (total * $scope.restaurantInfo.Tax) + $scope.BillSummary.DeliveryFee + $scope.BillSummary.RestaurantCharges;

        }
        else {
            $scope.BillSummary.IsShow = false;
            $scope.BillSummary.ItemTotal = 0;
        }
        $scope.restaurantInfo.MinDelivery = $scope.IsTableOrder ? 0 : $scope.restaurantInfo.MinDelivery;
        if ($scope.BillSummary.ItemTotal >= $scope.restaurantInfo.MinDelivery) {
            $scope.BillSummary.HasMinDelivery = true;
        }
        else {
            $scope.BillSummary.HasMinDelivery = false;
        }
    }

    $scope.ItemUpdate = function (menuItem, IsAdd, IsSubMenuAdd) {
        if (IsSubMenuAdd) {
            menuItem.Quantity = IsAdd ? menuItem.Quantity + 1 : menuItem.Quantity - 1;
        }
        else {
            menuItem.Quantity = IsAdd ? menuItem.Quantity + 1 : menuItem.Quantity - 1;
            $scope.alertMessage = menuItem.ItemName + (IsAdd ? " added to the Cart" : " removed from the Cart");
            $scope.alertTitle = "Success! ";
            //$scope.IsShowAlert = true;
            $timeout(function () {
                $scope.IsShowAlert = false;
            }, 2000);
        }
        if (menuItem.Quantity <= 0) {
            const index = $scope.selectedItems.indexOf(menuItem);
            if (index > -1) {
                $scope.selectedItems.splice(index, 1);
            }
        }
        $scope.GenerateBill();
        SaveCartItem();
    }
    $scope.SearchMenuItem = function () {
        let type = "";
        if ($scope.filterType == 1) {
            type = "Veg";
        }
        else {
            type = "Non Veg";
        }

        if (!$scope.searchText) {
            $("#searchbox").blur();
        }
        if ($scope.searchText != '' && $scope.searchText.length >= 3) {
            // if ($scope.searchText.length < 3)
            //     return false;
            let FilteredMenuList = [];
            let searchObject = JSON.parse(JSON.stringify(MenuList));
            angular.forEach(searchObject, function (value, key) {
                let FilteredMenu;
                var menuitems = $.grep(value.MenuItem, function (b) {
                    // return (b.CategoryName.toLowerCase().indexOf($scope.searchText.toLowerCase()) > -1 || b.Item.toLowerCase().indexOf($scope.searchText.toLowerCase()) > -1);
                    if ($scope.filterType > 0) {
                        return (b.Item.toLowerCase().indexOf($scope.searchText.toLowerCase()) > -1 && b.Type == type);
                    }
                    else {
                        return (b.Item.toLowerCase().indexOf($scope.searchText.toLowerCase()) > -1);
                    }
                });
                if (menuitems.length > 0) {
                    FilteredMenu = value;
                    FilteredMenu.MenuItem = menuitems;
                    FilteredMenuList.push(FilteredMenu);
                }
            });
            $scope.menudata = FilteredMenuList;
        }
        else if ($scope.filterType > 0) {
            $scope.FilterType();
        }
        else {
            $scope.menudata = JSON.parse(JSON.stringify(MenuList));
        }
        return false;
    }
    $scope.FilterType = function () {
        let type = "";
        if ($scope.filterType > 0) {
            if ($scope.filterType == 1) {
                type = "Veg";
            }
            else {
                type = "Non Veg";
            }
            // if ($scope.searchText.length < 3)
            //     return false;
            let FilteredMenuList = [];
            let searchObject = JSON.parse(JSON.stringify(MenuList));
            angular.forEach(searchObject, function (value, key) {
                let FilteredMenu;
                var menuitems = $.grep(value.MenuItem, function (b) {
                    // return (b.CategoryName.toLowerCase().indexOf($scope.searchText.toLowerCase()) > -1 || b.Item.toLowerCase().indexOf($scope.searchText.toLowerCase()) > -1);
                    return (b.Type == type);
                });
                if (menuitems.length > 0) {
                    FilteredMenu = value;
                    FilteredMenu.MenuItem = menuitems;
                    FilteredMenuList.push(FilteredMenu);
                }
            });
            $scope.menudata = FilteredMenuList;
        }
        else {
            $scope.menudata = JSON.parse(JSON.stringify(MenuList));
        }
        return false;
    }
    $scope.PlaceOrderInWhatsapp = function (grandTotal) {

        var itemsSelected = RestaurantInfo.WhatsappMessageHeader + "\n";
        if ($scope.IsTableOrder) {
            var id = GetParameterValues('Table');
            itemsSelected = "Table Number : " + id + "\n";
        }
        var whatsappNumber = RestaurantInfo.Whatsapp;
        if ($scope.selectedItems.length > 0) {
            angular.forEach($scope.selectedItems, function (value, index) {
                itemsSelected += index + 1 + ") " + value.ItemName + value.Portion + " - " + value.Quantity + "\n";
            });
        }
        itemsSelected = itemsSelected + "Total : " + grandTotal;
        //console.log(itemsSelected);
        var suggestions = $("#txtUserSuggetions").val();
        if (suggestions) {
            itemsSelected += "Customer Suggestions :- " + suggestions + ".";
        }
        $scope.redirectToWhatsApp(itemsSelected);
    }

    $scope.redirectToWhatsApp = function (itemsSelected) {
        var whatsappNumber = RestaurantInfo.Whatsapp;
        $window.open("https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(itemsSelected), '_blank');
    };

    function GetParameterValues(param) {
        var url = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for (var i = 0; i < url.length; i++) {
            var urlparam = url[i].split('=');
            if (urlparam[0] == param) {
                return urlparam[1];
            }
        }
    }
    $scope.CurrencyConverter = function (price) {
        return (new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            // limit to six significant digits (Possible values are from 1 to 21).
            maximumSignificantDigits: 6
        }).format(price));

    }
    $scope.CalculateTax = function (price) {
        return price * RestaurantInfo.Tax;

    }
    $scope.CalculateTotalPay = function (price) {
        return BillSummary.ItemTotal + (price * RestaurantInfo.Tax) + BillSummary.DeliveryFee;

    }
    function InitSlider() {
        $scope.menudata = JSON.parse(JSON.stringify(MenuList));
        $scope.categoryList = Categories;
        $scope.QuanityCount = 1;
        $scope.recommendedItems = RecommendedItemList;
        if ($scope.selectedItems.length > 0) {
            $scope.GenerateBill();
        }
        sli();
        setTimeout(sli, 1);//calling sli function 
    }
    InitSlider();

    function TableOrder() {
        var id = GetParameterValues('Table');
        if (id > 0) {
            $scope.IsTableOrder = true;
            $scope.BillSummary.DeliveryFee = 0;
            $scope.BillSummary.RestaurantCharges = 0;
        }
    }
}]);





